package com.procost.api.controller;

import com.procost.api.model.User;
import com.procost.api.dto.RegisterRequest;
import com.procost.api.dto.MessageResponse;
import com.procost.api.repository.UserRepository;
import com.procost.api.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private PasswordEncoder encoder;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllUsers() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("User accessing getAllUsers: {}, Authorities: {}", 
            auth.getName(), auth.getAuthorities());
        
        // Additional debug info
        logger.debug("Is authenticated: {}", auth.isAuthenticated());
        logger.debug("Principal: {}", auth.getPrincipal());
        logger.debug("Credentials: {}", auth.getCredentials());
        
        try {
            // Log before attempting database query
            logger.info("Attempting to retrieve all users from database");
            
            List<User> users = userRepository.findAll();
            
            // Log individual users for debugging
            for (User user : users) {
                logger.info("User retrieved - ID: {}, Username: {}, IsAdmin: {}", 
                            user.getId(), user.getUsername(), user.isAdmin());
            }
            
            logger.info("Successfully retrieved {} users from database", users.size());
            return users;
        } catch (Exception e) {
            logger.error("Error retrieving users from database: {}", e.getMessage());
            logger.error("Error class: {}", e.getClass().getName());
            logger.error("Stack trace: ", e);
            throw e;
        }
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            logger.info("Creating new user: {}, isAdmin: {}", registerRequest.getUsername(), registerRequest.isAdmin());
            
            // Check if the username is already taken
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                logger.warn("Username already taken: {}", registerRequest.getUsername());
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Username is already taken!"));
            }
            
            // Check if email is already in use
            if (registerRequest.getEmail() != null && !registerRequest.getEmail().isEmpty() && 
                    userRepository.existsByEmail(registerRequest.getEmail())) {
                logger.warn("Email already in use: {}", registerRequest.getEmail());
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Email is already in use!"));
            }
            
            // Create new user
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setPassword(encoder.encode(registerRequest.getPassword()));
            
            // Handle empty email - set to null if empty/blank to avoid unique constraint violation
            String email = registerRequest.getEmail();
            if (email != null && email.trim().isEmpty()) {
                email = null;
            }
            user.setEmail(email);
            
            user.setAdmin(registerRequest.isAdmin());
            
            logger.debug("Saving new user to database: {}", user.getUsername());
            User savedUser = userRepository.save(user);
            logger.info("User created successfully: {}, ID: {}, isAdmin: {}", 
                       savedUser.getUsername(), savedUser.getId(), savedUser.isAdmin());
            
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            logger.error("Error creating user: {}", e.getMessage());
            logger.error("Exception class: {}", e.getClass().getName());
            logger.error("Stack trace:", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error creating user: " + e.getMessage()));
        }
    }
    
    @PatchMapping("/{id}/toggle-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleAdmin(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        Optional<User> userOptional = userRepository.findById(id);
        
        if (!userOptional.isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: User not found!"));
        }
        
        User user = userOptional.get();
        Boolean isAdmin = payload.get("isAdmin");
        
        if (isAdmin != null) {
            user.setAdmin(isAdmin);
            userRepository.save(user);
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: isAdmin field is required!"));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            // Get the current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = auth.getName();
            logger.info("User {} attempting to delete user with ID: {}", currentUsername, id);
            
            Optional<User> userOptional = userRepository.findById(id);
            
            if (!userOptional.isPresent()) {
                logger.warn("Attempted to delete non-existent user with ID: {}", id);
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: User not found!"));
            }
            
            User userToDelete = userOptional.get();
            
            // Check if user is trying to delete themselves
            Optional<User> currentUserOpt = userRepository.findByUsername(currentUsername);
            if (currentUserOpt.isPresent() && currentUserOpt.get().getId().equals(id)) {
                logger.warn("User {} attempted to delete themselves", currentUsername);
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: You cannot delete your own account!"));
            }
            
            logger.info("Deleting user: {}, ID: {}", userToDelete.getUsername(), userToDelete.getId());
            userRepository.deleteById(id);
            logger.info("User deleted successfully: {}", userToDelete.getUsername());
            
            return ResponseEntity.ok(new MessageResponse("User deleted successfully!"));
        } catch (Exception e) {
            logger.error("Error deleting user with ID {}: {}", id, e.getMessage());
            logger.error("Exception class: {}", e.getClass().getName());
            logger.error("Stack trace:", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error deleting user: " + e.getMessage()));
        }
    }
} 