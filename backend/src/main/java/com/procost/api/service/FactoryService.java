package com.procost.api.service;

import com.procost.api.model.Factory;
import com.procost.api.model.PackagingRate;
import com.procost.api.model.RateTable;
import com.procost.api.repository.FactoryRepository;
import com.procost.api.repository.PackagingRateRepository;
import com.procost.api.repository.RateTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FactoryService {

    private static final Logger logger = LoggerFactory.getLogger(FactoryService.class);
    
    private final FactoryRepository factoryRepository;
    private final PackagingRateRepository packagingRateRepository;
    private final RateTableRepository rateTableRepository;

    @Autowired
    public FactoryService(FactoryRepository factoryRepository, 
                          PackagingRateRepository packagingRateRepository,
                          RateTableRepository rateTableRepository) {
        this.factoryRepository = factoryRepository;
        this.packagingRateRepository = packagingRateRepository;
        this.rateTableRepository = rateTableRepository;
    }

    public List<Factory> getAllFactories() {
        return factoryRepository.findAll();
    }

    public Optional<Factory> getFactoryById(Long id) {
        return factoryRepository.findById(id);
    }

    public Factory createFactory(Factory factory) {
        return factoryRepository.save(factory);
    }

    public Factory updateFactory(Factory factory) {
        return factoryRepository.save(factory);
    }

    public void deleteFactory(Long id) {
        factoryRepository.deleteById(id);
    }

    @Transactional
    public Factory savePackagingRates(Long factoryId, List<PackagingRate> packagingRates) {
        try {
            logger.info("Attempting to save packaging rates for factory ID: {}", factoryId);
            logger.info("Number of packaging rates to save: {}", packagingRates.size());
            
            Optional<Factory> factoryOpt = factoryRepository.findById(factoryId);
            if (!factoryOpt.isPresent()) {
                logger.warn("Factory not found with id: {}", factoryId);
                throw new RuntimeException("Factory not found with id: " + factoryId);
            }
            
            Factory factory = factoryOpt.get();
            logger.info("Found factory: {}", factory.getName());
            
            // Use repository for operations
            // First ensure this is transactional by executing in a single call
            // This will delete all existing entries for this factory directly from the DB
            int deleted = packagingRateRepository.deleteAllByFactoryId(factoryId);
            logger.info("Deleted {} existing packaging rates", deleted);
            
            // Force commit the transaction to ensure deletion is processed
            packagingRateRepository.flush();
            
            // Clear the in-memory list as well
            factory.getPackagingRates().clear();
            factoryRepository.save(factory);
            factoryRepository.flush();
            
            // Create completely new PackagingRate objects to avoid any ID conflicts
            List<PackagingRate> newRates = new ArrayList<>();
            
            for (PackagingRate sourceRate : packagingRates) {
                // Create a completely new instance to avoid any association with previous records
                PackagingRate newRate = new PackagingRate();
                newRate.setId(null); // Explicitly set ID to null
                newRate.setProdType(sourceRate.getProdType());
                newRate.setProduct(sourceRate.getProduct());
                newRate.setBoxQty(sourceRate.getBoxQty());
                newRate.setPack(sourceRate.getPack());
                newRate.setTransportMode(sourceRate.getTransportMode());
                newRate.setPackagingRate(sourceRate.getPackagingRate());
                
                // Set factory explicitly
                newRate.setFactory(factory);
                
                // Save the new rate directly to the database
                PackagingRate savedRate = packagingRateRepository.save(newRate);
                newRates.add(savedRate);
            }
            
            // Update factory's packaging rates list with the saved rates
            factory.getPackagingRates().clear();
            factory.getPackagingRates().addAll(newRates);
            
            logger.info("Saving factory with {} new packaging rates", newRates.size());
            Factory savedFactory = factoryRepository.save(factory);
            logger.info("Successfully saved factory with packaging rates");
            return savedFactory;
        } catch (Exception e) {
            logger.error("Error saving packaging rates: {}", e.getMessage(), e);
            throw new RuntimeException("Error saving packaging rates: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Factory saveRateTables(Long factoryId, List<RateTable> rateTables) {
        try {
            logger.info("Attempting to save rate tables for factory ID: {}", factoryId);
            logger.info("Number of rate tables to save: {}", rateTables.size());
            
            Optional<Factory> factoryOpt = factoryRepository.findById(factoryId);
            if (!factoryOpt.isPresent()) {
                logger.warn("Factory not found with id: {}", factoryId);
                throw new RuntimeException("Factory not found with id: " + factoryId);
            }
            
            Factory factory = factoryOpt.get();
            logger.info("Found factory: {}", factory.getName());
            
            // Use repository for operations
            // First ensure this is transactional by executing in a single call
            // This will delete all existing entries for this factory directly from the DB
            int deleted = rateTableRepository.deleteAllByFactoryId(factoryId);
            logger.info("Deleted {} existing rate tables", deleted);
            
            // Force commit the transaction to ensure deletion is processed
            rateTableRepository.flush();
            
            // Clear the in-memory list as well
            factory.getRateTables().clear();
            factoryRepository.save(factory);
            factoryRepository.flush();
            
            // Create completely new RateTable objects to avoid any ID conflicts
            List<RateTable> newRates = new ArrayList<>();
            
            for (RateTable sourceRate : rateTables) {
                // Create a completely new instance to avoid any association with previous records
                RateTable newRate = new RateTable();
                newRate.setId(null); // Explicitly set ID to null
                newRate.setProduct(sourceRate.getProduct());
                newRate.setTrimType(sourceRate.getTrimType());
                newRate.setRmSpec(sourceRate.getRmSpec());
                newRate.setRatePerKg(sourceRate.getRatePerKg());
                
                // Set factory explicitly
                newRate.setFactory(factory);
                
                // Save the new rate directly to the database
                RateTable savedRate = rateTableRepository.save(newRate);
                newRates.add(savedRate);
            }
            
            // Update factory's rate tables list with the saved rates
            factory.getRateTables().clear();
            factory.getRateTables().addAll(newRates);
            
            logger.info("Saving factory with {} new rate tables", newRates.size());
            Factory savedFactory = factoryRepository.save(factory);
            logger.info("Successfully saved factory with rate tables");
            return savedFactory;
        } catch (Exception e) {
            logger.error("Error saving rate tables: {}", e.getMessage(), e);
            throw new RuntimeException("Error saving rate tables: " + e.getMessage(), e);
        }
    }
    
    public List<PackagingRate> getPackagingRates(Long factoryId) {
        Optional<Factory> factoryOpt = factoryRepository.findById(factoryId);
        if (factoryOpt.isPresent()) {
            // Get the factory
            Factory factory = factoryOpt.get();
            
            // Use the new repository method to fetch all packaging rates directly
            List<PackagingRate> allRates = packagingRateRepository.findAllByFactoryId(factoryId);
            
            // Log the actual count being returned
            logger.debug("Returning {} packaging rates for factory ID: {}", allRates.size(), factoryId);
            
            return allRates;
        }
        throw new RuntimeException("Factory not found with id: " + factoryId);
    }
    
    public List<RateTable> getRateTables(Long factoryId) {
        Optional<Factory> factoryOpt = factoryRepository.findById(factoryId);
        if (factoryOpt.isPresent()) {
            // Get the factory
            Factory factory = factoryOpt.get();
            
            // Use the new repository method to fetch all rate tables directly
            List<RateTable> allRates = rateTableRepository.findAllByFactoryId(factoryId);
            
            // Log the actual count being returned
            logger.debug("Returning {} rate tables for factory ID: {}", allRates.size(), factoryId);
            
            return allRates;
        }
        throw new RuntimeException("Factory not found with id: " + factoryId);
    }
} 