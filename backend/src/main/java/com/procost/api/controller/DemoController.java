package com.procost.api.controller;

import com.procost.api.service.DemoDataService;
import com.procost.api.service.QuoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/demo")
@CrossOrigin(originPatterns = "*", allowCredentials = "false")
public class DemoController {

    @Autowired
    private DemoDataService demoDataService;

    @Autowired
    private QuoteService quoteService;

    @PostMapping("/populate")
    public ResponseEntity<Map<String, String>> populateDemoData() {
        try {
            demoDataService.populateDemoData();
            // Note: Demo quotes can be generated from enquiries using QuoteService.generateQuoteForEnquiry()
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Demo data populated successfully");
            response.put("description", "Created demo enquiries. Use quote generation endpoints for quotes.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to populate demo data: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/populate-quotes")
    public ResponseEntity<Map<String, String>> populateDemoQuotes() {
        try {
            // This endpoint is deprecated. Use /api/quotes/generate-from-enquiry/{enquiryId} instead
            Map<String, String> response = new HashMap<>();
            response.put("status", "info");
            response.put("message", "Demo quote population is deprecated");
            response.put("description", "Use /api/quotes/generate-from-enquiry/{enquiryId} to generate quotes from enquiries");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to populate demo quotes: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getDemoDataStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "available");
        response.put("endpoint", "/api/demo/populate");
        response.put("description", "Demo data service for enquiry management system");
        
        return ResponseEntity.ok(response);
    }
} 