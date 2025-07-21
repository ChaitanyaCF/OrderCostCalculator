package com.procost.api.controller;

import com.procost.api.model.ChargeRate;
import com.procost.api.service.ChargeRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/charge-rates")
public class ChargeRateController {
    
    @Autowired
    private ChargeRateService chargeRateService;
    
    @GetMapping
    public ResponseEntity<List<ChargeRate>> getAllChargeRates() {
        List<ChargeRate> chargeRates = chargeRateService.getAllChargeRates();
        return new ResponseEntity<>(chargeRates, HttpStatus.OK);
    }
    
    @GetMapping("/factory/{factoryId}")
    public ResponseEntity<List<ChargeRate>> getChargeRatesByFactory(@PathVariable Long factoryId) {
        List<ChargeRate> chargeRates = chargeRateService.getChargeRatesByFactory(factoryId);
        return new ResponseEntity<>(chargeRates, HttpStatus.OK);
    }
    
    @GetMapping("/factory/{factoryId}/charge/{chargeName}")
    public ResponseEntity<List<ChargeRate>> getChargeRatesByFactoryAndName(
            @PathVariable Long factoryId,
            @PathVariable String chargeName) {
        List<ChargeRate> chargeRates = chargeRateService.getChargeRatesByFactoryAndName(factoryId, chargeName);
        return new ResponseEntity<>(chargeRates, HttpStatus.OK);
    }
    
    @GetMapping("/factory/{factoryId}/product-type/{productType}")
    public ResponseEntity<List<ChargeRate>> getChargeRatesByFactoryAndProductType(
            @PathVariable Long factoryId,
            @PathVariable String productType) {
        List<ChargeRate> chargeRates = chargeRateService.getChargeRatesByFactoryAndProductType(factoryId, productType);
        return new ResponseEntity<>(chargeRates, HttpStatus.OK);
    }
    
    @GetMapping("/factory/{factoryId}/product/{product}")
    public ResponseEntity<List<ChargeRate>> getChargeRatesByFactoryAndProduct(
            @PathVariable Long factoryId,
            @PathVariable String product) {
        List<ChargeRate> chargeRates = chargeRateService.getChargeRatesByFactoryAndProduct(factoryId, product);
        return new ResponseEntity<>(chargeRates, HttpStatus.OK);
    }
    
    @GetMapping("/factory/{factoryId}/filter")
    public ResponseEntity<List<ChargeRate>> getFilteredChargeRates(
            @PathVariable Long factoryId,
            @RequestParam(required = false) String chargeName,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String product) {
        
        // Use empty strings for null parameters
        chargeName = chargeName == null ? "" : chargeName;
        productType = productType == null ? "" : productType;
        product = product == null ? "" : product;
        
        List<ChargeRate> chargeRates = chargeRateService.getFilteredChargeRates(
            factoryId, chargeName, productType, product);
        return new ResponseEntity<>(chargeRates, HttpStatus.OK);
    }
    
    @GetMapping("/factory/{factoryId}/specific")
    public ResponseEntity<?> getSpecificChargeRate(
            @PathVariable Long factoryId,
            @RequestParam String chargeName,
            @RequestParam String productType,
            @RequestParam String product,
            @RequestParam(required = false) String subtype) {
        
        // Use empty string for null subtype
        subtype = subtype == null ? "" : subtype;
        
        Optional<ChargeRate> chargeRate = chargeRateService.getSpecificChargeRate(
            factoryId, chargeName, productType, product, subtype);
        
        if (chargeRate.isPresent()) {
            return new ResponseEntity<>(chargeRate.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Charge rate not found with the specified criteria", HttpStatus.NOT_FOUND);
        }
    }
    
    @PostMapping("/factory/{factoryId}")
    public ResponseEntity<ChargeRate> createChargeRate(
            @PathVariable Long factoryId,
            @Valid @RequestBody ChargeRate chargeRate) {
        ChargeRate createdChargeRate = chargeRateService.createChargeRate(factoryId, chargeRate);
        return new ResponseEntity<>(createdChargeRate, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ChargeRate> updateChargeRate(
            @PathVariable Long id,
            @Valid @RequestBody ChargeRate chargeRate) {
        ChargeRate updatedChargeRate = chargeRateService.updateChargeRate(id, chargeRate);
        return new ResponseEntity<>(updatedChargeRate, HttpStatus.OK);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChargeRate(@PathVariable Long id) {
        chargeRateService.deleteChargeRate(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    @PostMapping("/factory/{factoryId}/batch")
    public ResponseEntity<List<ChargeRate>> saveAllChargeRates(
            @PathVariable Long factoryId,
            @Valid @RequestBody List<ChargeRate> chargeRates) {
        List<ChargeRate> savedChargeRates = chargeRateService.saveAllChargeRates(factoryId, chargeRates);
        return new ResponseEntity<>(savedChargeRates, HttpStatus.CREATED);
    }
} 