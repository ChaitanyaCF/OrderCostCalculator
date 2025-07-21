package com.procost.api.controller;

import com.procost.api.dto.JwtResponse;
import com.procost.api.dto.LoginRequest;
import com.procost.api.dto.MessageResponse;
import com.procost.api.dto.RegisterRequest;
import com.procost.api.model.User;
import com.procost.api.repository.UserRepository;
import com.procost.api.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            logger.info("Login attempt for user: {}", loginRequest.getUsername());
            JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
            logger.info("Login successful for user: {}", loginRequest.getUsername());
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            logger.error("Login error for user {}: {}", loginRequest.getUsername(), e.getMessage());
            logger.error("Exception class: {}", e.getClass().getName());
            logger.error("Stack trace:", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Authentication failed");
            response.put("message", e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            response.put("status", HttpStatus.UNAUTHORIZED.value());
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        MessageResponse response = authService.registerUser(registerRequest);
        return ResponseEntity.ok(response);
    }
    
    // Special endpoint to make Chaitanya an admin - this is a one-time use endpoint
    @GetMapping("/setup-admin")
    public ResponseEntity<?> setupAdmin() {
        logger.info("Setting up Chaitanya as admin");
        
        Optional<User> userOpt = userRepository.findByUsername("Chaitanya");
        if (!userOpt.isPresent()) {
            logger.error("Chaitanya user not found");
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Chaitanya user not found"));
        }
        
        User user = userOpt.get();
        user.setAdmin(true);
        userRepository.save(user);
        
        logger.info("Chaitanya has been made an admin");
        return ResponseEntity.ok(new MessageResponse("Chaitanya has been made an admin"));
    }
    
    @PostMapping("/generate-zapier-token")
    public ResponseEntity<?> generateZapierToken(@RequestBody Map<String, String> request) {
        logger.info("Zapier token generation requested");
        
        String zapierSecret = request.get("zapierSecret");
        
        // Use a secret key for Zapier authentication (in production, use environment variable)
        String expectedSecret = "ZAPIER_SECRET_2024";
        
        if (!expectedSecret.equals(zapierSecret)) {
            logger.error("Invalid Zapier secret provided");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error: Invalid Zapier secret"));
        }
        
        try {
            // Generate a long-lived JWT token for Zapier integration
            String token = authService.generateTokenForZapier("zapier-integration");
            
            logger.info("Zapier JWT token generated successfully");
            
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("type", "Bearer");
            response.put("usage", "Add this token to your Zapier webhook headers as: Authorization Bearer " + token);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error generating Zapier token: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error: Could not generate Zapier token"));
        }
    }
}