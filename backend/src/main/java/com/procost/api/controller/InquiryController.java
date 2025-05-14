package com.procost.api.controller;

import com.procost.api.dto.*;
import com.procost.api.service.CalculatorService;
import com.procost.api.service.DataLoaderService;
import com.procost.api.service.InquiryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/inquiries")
@PreAuthorize("isAuthenticated()")
public class InquiryController {
    
    @Autowired
    private InquiryService inquiryService;
    
    @Autowired
    private DataLoaderService dataLoaderService;
    
    @Autowired
    private CalculatorService calculatorService;
    
    @GetMapping("/products")
    public ResponseEntity<List<String>> getProductOptions() {
        return ResponseEntity.ok(dataLoaderService.getProductOptions());
    }
    
    @GetMapping("/trimTypes")
    public ResponseEntity<List<String>> getTrimTypes(@RequestParam String product) {
        return ResponseEntity.ok(dataLoaderService.getTrimTypes(product));
    }
    
    @GetMapping("/rmSpecs")
    public ResponseEntity<List<String>> getRmSpecs() {
        return ResponseEntity.ok(dataLoaderService.getRmSpecs());
    }
    
    @GetMapping("/prodTypes")
    public ResponseEntity<List<String>> getProdTypes() {
        return ResponseEntity.ok(dataLoaderService.getProdTypes());
    }
    
    @GetMapping("/packagingTypes")
    public ResponseEntity<List<String>> getPackagingTypes(
            @RequestParam String product,
            @RequestParam String prodType) {
        return ResponseEntity.ok(dataLoaderService.getPackagingTypes(product, prodType));
    }
    
    @GetMapping("/packagingSizes")
    public ResponseEntity<List<String>> getPackagingSizes(
            @RequestParam String product,
            @RequestParam String prodType) {
        return ResponseEntity.ok(dataLoaderService.getPackagingSizes(product, prodType));
    }
    
    @GetMapping("/transportModes")
    public ResponseEntity<List<String>> getTransportModes() {
        return ResponseEntity.ok(dataLoaderService.getTransportModes());
    }
    
    @GetMapping("/calculateRates")
    public ResponseEntity<CalculateRatesResponse> calculateRates(
            @RequestParam String product,
            @RequestParam String trimType,
            @RequestParam String rmSpec,
            @RequestParam String prodType,
            @RequestParam String packType,
            @RequestParam String transportMode) {
        return ResponseEntity.ok(calculatorService.calculateRates(
                product, trimType, rmSpec, prodType, packType, transportMode
        ));
    }
    
    @PostMapping("/calculateCharges")
    public ResponseEntity<CalculateChargesResponse> calculateCharges(
            @Valid @RequestBody CalculateChargesRequest request) {
        return ResponseEntity.ok(calculatorService.calculateCharges(request));
    }
    
    @GetMapping("/user")
    public ResponseEntity<List<InquiryResponse>> getUserInquiries() {
        return ResponseEntity.ok(inquiryService.getUserInquiries());
    }
    
    @PostMapping
    public ResponseEntity<MessageResponse> saveInquiry(@Valid @RequestBody InquiryRequest request) {
        return ResponseEntity.ok(inquiryService.saveInquiry(request));
    }
}