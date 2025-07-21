package com.procost.api.service;

import com.procost.api.model.ChargeRate;
import com.procost.api.model.Factory;
import com.procost.api.repository.ChargeRateRepository;
import com.procost.api.repository.FactoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;

@Service
public class ChargeRateService {
    
    @Autowired
    private ChargeRateRepository chargeRateRepository;
    
    @Autowired
    private FactoryRepository factoryRepository;
    
    public List<ChargeRate> getAllChargeRates() {
        return chargeRateRepository.findAll();
    }
    
    public List<ChargeRate> getChargeRatesByFactory(Long factoryId) {
        return chargeRateRepository.findByFactoryId(factoryId);
    }
    
    public List<ChargeRate> getChargeRatesByFactoryAndName(Long factoryId, String chargeName) {
        return chargeRateRepository.findByFactoryIdAndChargeName(factoryId, chargeName);
    }
    
    public List<ChargeRate> getChargeRatesByFactoryAndProductType(Long factoryId, String productType) {
        return chargeRateRepository.findByFactoryIdAndProductType(factoryId, productType);
    }
    
    public List<ChargeRate> getChargeRatesByFactoryAndProduct(Long factoryId, String product) {
        return chargeRateRepository.findByFactoryIdAndProduct(factoryId, product);
    }
    
    public List<ChargeRate> getFilteredChargeRates(Long factoryId, String chargeName, 
                                                  String productType, String product) {
        return chargeRateRepository.findByFactoryIdAndChargeNameAndProductTypeAndProduct(
            factoryId, chargeName, productType, product);
    }
    
    public Optional<ChargeRate> getSpecificChargeRate(Long factoryId, String chargeName, 
                                               String productType, String product, String subtype) {
        return Optional.ofNullable(chargeRateRepository.findSpecificChargeRate(
            factoryId, chargeName, productType, product, subtype));
    }
    
    public ChargeRate createChargeRate(Long factoryId, ChargeRate chargeRate) {
        Factory factory = factoryRepository.findById(factoryId)
            .orElseThrow(() -> new EntityNotFoundException("Factory not found with id: " + factoryId));
        
        chargeRate.setFactory(factory);
        return chargeRateRepository.save(chargeRate);
    }
    
    public ChargeRate updateChargeRate(Long id, ChargeRate chargeRateDetails) {
        ChargeRate chargeRate = chargeRateRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Charge rate not found with id: " + id));
        
        chargeRate.setChargeName(chargeRateDetails.getChargeName());
        chargeRate.setProductType(chargeRateDetails.getProductType());
        chargeRate.setProduct(chargeRateDetails.getProduct());
        chargeRate.setSubtype(chargeRateDetails.getSubtype());
        chargeRate.setRateValue(chargeRateDetails.getRateValue());
        
        return chargeRateRepository.save(chargeRate);
    }
    
    public void deleteChargeRate(Long id) {
        ChargeRate chargeRate = chargeRateRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Charge rate not found with id: " + id));
        
        chargeRateRepository.delete(chargeRate);
    }
    
    public List<ChargeRate> saveAllChargeRates(Long factoryId, List<ChargeRate> chargeRates) {
        Factory factory = factoryRepository.findById(factoryId)
            .orElseThrow(() -> new EntityNotFoundException("Factory not found with id: " + factoryId));
        
        // Set the factory for each charge rate
        for (ChargeRate chargeRate : chargeRates) {
            chargeRate.setFactory(factory);
        }
        
        return chargeRateRepository.saveAll(chargeRates);
    }
} 