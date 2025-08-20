package com.procost.api.controller;

import com.procost.api.model.*;
import com.procost.api.repository.EmailEnquiryRepository;
import com.procost.api.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/email-enquiries")
@CrossOrigin(originPatterns = "*", allowCredentials = "false")
public class EmailEnquiryController {
    
    @Autowired
    private EmailEnquiryRepository emailEnquiryRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    /**
     * Get all email enquiries for the dashboard
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllEnquiries() {
        List<EmailEnquiry> enquiries = emailEnquiryRepository.findAllByOrderByReceivedAtDesc();
        
        List<Map<String, Object>> enquiryDtos = enquiries.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(enquiryDtos);
    }
    
    /**
     * Get enquiries by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Map<String, Object>>> getEnquiriesByStatus(@PathVariable String status) {
        EnquiryStatus enquiryStatus = EnquiryStatus.valueOf(status.toUpperCase());
        List<EmailEnquiry> enquiries = emailEnquiryRepository.findByStatusOrderByReceivedAtDesc(enquiryStatus);
        
        List<Map<String, Object>> enquiryDtos = enquiries.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(enquiryDtos);
    }
    
    /**
     * Get recent enquiries (last 7 days)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentEnquiries() {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        List<EmailEnquiry> enquiries = emailEnquiryRepository.findRecentEnquiries(since);
        
        List<Map<String, Object>> enquiryDtos = enquiries.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(enquiryDtos);
    }
    
    /**
     * Get enquiry by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getEnquiryById(@PathVariable Long id) {
        Optional<EmailEnquiry> enquiry = emailEnquiryRepository.findById(id);
        
        if (enquiry.isPresent()) {
            return ResponseEntity.ok(convertToDetailedDto(enquiry.get()));
        }
        
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Get enquiry by enquiry ID (string)
     */
    @GetMapping("/by-enquiry-id/{enquiryId}")
    public ResponseEntity<Map<String, Object>> getEnquiryByEnquiryId(@PathVariable String enquiryId) {
        Optional<EmailEnquiry> enquiry = emailEnquiryRepository.findByEnquiryId(enquiryId);
        
        if (enquiry.isPresent()) {
            return ResponseEntity.ok(convertToDetailedDto(enquiry.get()));
        }
        
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Update enquiry status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateEnquiryStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            EnquiryStatus enquiryStatus = EnquiryStatus.valueOf(status.toUpperCase());
            
            Optional<EmailEnquiry> enquiryOpt = emailEnquiryRepository.findById(id);
            if (enquiryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            EmailEnquiry enquiry = enquiryOpt.get();
            enquiry.setStatus(enquiryStatus);
            emailEnquiryRepository.save(enquiry);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Enquiry status updated to " + status);
            response.put("enquiryId", enquiry.getEnquiryId());
            response.put("newStatus", status);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Invalid status value");
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get dashboard statistics
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Count enquiries by status
        long totalEnquiries = emailEnquiryRepository.count();
        long receivedEnquiries = emailEnquiryRepository.countByStatus(EnquiryStatus.RECEIVED);
        long processingEnquiries = emailEnquiryRepository.countByStatus(EnquiryStatus.PROCESSING);
        long quotedEnquiries = emailEnquiryRepository.countByStatus(EnquiryStatus.QUOTED);
        long convertedEnquiries = emailEnquiryRepository.countByStatus(EnquiryStatus.CONVERTED);
        
        stats.put("totalEnquiries", totalEnquiries);
        stats.put("receivedEnquiries", receivedEnquiries);
        stats.put("processingEnquiries", processingEnquiries);
        stats.put("quotedEnquiries", quotedEnquiries);
        stats.put("convertedEnquiries", convertedEnquiries);
        
        // For now, mock quotes and orders (until those controllers are implemented)
        stats.put("pendingQuotes", quotedEnquiries);
        stats.put("activeOrders", convertedEnquiries);
        stats.put("totalCustomers", customerRepository.count());
        
        // Recent activity (last 5 enquiries)
        List<EmailEnquiry> recentEnquiries = emailEnquiryRepository.findRecentEnquiries(LocalDateTime.now().minusDays(7))
            .stream()
            .limit(5)
            .collect(Collectors.toList());
        
        List<Map<String, Object>> recentActivity = recentEnquiries.stream()
            .map(enquiry -> {
                Map<String, Object> activity = new HashMap<>();
                activity.put("id", enquiry.getId());
                activity.put("type", "ENQUIRY");
                activity.put("title", "New enquiry from " + enquiry.getCustomer().getCompanyName());
                activity.put("description", summarizeEnquiry(enquiry));
                activity.put("timestamp", formatTimeAgo(enquiry.getReceivedAt()));
                activity.put("status", enquiry.getStatus().toString());
                return activity;
            })
            .collect(Collectors.toList());
        
        stats.put("recentActivity", recentActivity);
        
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Delete an enquiry by ID
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEnquiry(@PathVariable Long id) {
        try {
            Optional<EmailEnquiry> enquiryOptional = emailEnquiryRepository.findById(id);
            
            if (!enquiryOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            EmailEnquiry enquiry = enquiryOptional.get();
            emailEnquiryRepository.deleteById(id);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Enquiry " + enquiry.getEnquiryId() + " deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete enquiry: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Convert EmailEnquiry to DTO for frontend
     */
    private Map<String, Object> convertToDto(EmailEnquiry enquiry) {
        Map<String, Object> dto = new HashMap<>();
        
        dto.put("id", enquiry.getId());
        dto.put("enquiryId", enquiry.getEnquiryId());
        dto.put("fromEmail", enquiry.getFromEmail());
        dto.put("subject", enquiry.getSubject());
        dto.put("status", enquiry.getStatus().toString());
        dto.put("receivedAt", enquiry.getReceivedAt().toString());
        dto.put("processedAt", enquiry.getProcessedAt() != null ? enquiry.getProcessedAt().toString() : null);
        dto.put("aiProcessed", enquiry.getAiProcessed());
        dto.put("processingNotes", enquiry.getProcessingNotes());
        dto.put("emailBody", enquiry.getEmailBody());
        dto.put("originalEmailId", enquiry.getOriginalEmailId());
        
        // Thread tracking via originalEmailId field
        
        // Customer info
        if (enquiry.getCustomer() != null) {
            Map<String, Object> customerDto = new HashMap<>();
            customerDto.put("id", enquiry.getCustomer().getId());
            customerDto.put("email", enquiry.getCustomer().getEmail());
            customerDto.put("contactPerson", enquiry.getCustomer().getContactPerson());
            customerDto.put("companyName", enquiry.getCustomer().getCompanyName());
            customerDto.put("phone", enquiry.getCustomer().getPhone());
            customerDto.put("address", enquiry.getCustomer().getAddress());
            customerDto.put("createdAt", enquiry.getCustomer().getCreatedAt().toString());
            customerDto.put("updatedAt", enquiry.getCustomer().getUpdatedAt().toString());
            dto.put("customer", customerDto);
        }
        
        // Enquiry items summary
        List<Map<String, Object>> itemDtos = new ArrayList<>();
        if (enquiry.getEnquiryItems() != null) {
            itemDtos = enquiry.getEnquiryItems().stream()
                .map(this::convertItemToDto)
                .collect(Collectors.toList());
        }
        dto.put("enquiryItems", itemDtos);
        dto.put("itemsCount", itemDtos.size());
        
        return dto;
    }
    
    /**
     * Convert EmailEnquiry to detailed DTO with full information
     */
    private Map<String, Object> convertToDetailedDto(EmailEnquiry enquiry) {
        Map<String, Object> dto = convertToDto(enquiry);
        
        // All email metadata fields are now included in the base DTO
        // No additional fields needed for detailed view currently
        
        return dto;
    }
    
    /**
     * Convert EnquiryItem to DTO
     */
    private Map<String, Object> convertItemToDto(EnquiryItem item) {
        Map<String, Object> dto = new HashMap<>();
        
        dto.put("id", item.getId());
        dto.put("customerSkuReference", item.getCustomerSkuReference());
        dto.put("productDescription", item.getProductDescription());
        dto.put("requestedQuantity", item.getRequestedQuantity());
        dto.put("deliveryRequirement", item.getDeliveryRequirement());
        dto.put("specialInstructions", item.getSpecialInstructions());
        
        // Mapped fields
        dto.put("product", item.getProduct());
        dto.put("trimType", item.getTrimType());
        dto.put("rmSpec", item.getRmSpec());
        dto.put("productType", item.getProductType());
        dto.put("packagingType", item.getPackagingType());
        dto.put("packMaterial", item.getPackMaterial() != null ? item.getPackMaterial() : "Not specified");
        dto.put("boxQuantity", item.getBoxQuantity() != null ? item.getBoxQuantity() : "Not specified");
        dto.put("transportMode", item.getTransportMode());
        
        // Pricing (if available)
        dto.put("unitPrice", item.getUnitPrice());
        dto.put("totalPrice", item.getTotalPrice());
        dto.put("currency", item.getCurrency());
        
        // AI processing info
        dto.put("aiMapped", item.getAiMapped());
        dto.put("mappingConfidence", item.getMappingConfidence());
        dto.put("aiProcessingNotes", item.getAiProcessingNotes());
        dto.put("processedAt", item.getProcessedAt() != null ? item.getProcessedAt().toString() : null);
        
        return dto;
    }
    
    /**
     * Summarize enquiry for recent activity
     */
    private String summarizeEnquiry(EmailEnquiry enquiry) {
        if (enquiry.getEnquiryItems() == null || enquiry.getEnquiryItems().isEmpty()) {
            return "General enquiry";
        }
        
        EnquiryItem firstItem = enquiry.getEnquiryItems().get(0);
        int totalItems = enquiry.getEnquiryItems().size();
        
        if (totalItems == 1) {
            return String.format("%s - %d units", 
                firstItem.getProduct(), firstItem.getRequestedQuantity());
        } else {
            return String.format("%s + %d more items", 
                firstItem.getProduct(), totalItems - 1);
        }
    }
    
    /**
     * Format time ago string
     */
    private String formatTimeAgo(LocalDateTime dateTime) {
        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(dateTime, now).toMinutes();
        
        if (minutes < 60) {
            return minutes + " minutes ago";
        } else if (minutes < 1440) { // 24 hours
            return (minutes / 60) + " hours ago";
        } else {
            return (minutes / 1440) + " days ago";
        }
    }
} 