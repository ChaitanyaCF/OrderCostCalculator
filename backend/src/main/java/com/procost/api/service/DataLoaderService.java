package com.procost.api.service;

import com.procost.api.model.PackagingRate;
import com.procost.api.model.RateTable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DataLoaderService {
    
    private final List<RateTable> rateTableData = new ArrayList<>();
    private final List<PackagingRate> packagingRateData = new ArrayList<>();
    
    @PostConstruct
    public void init() {
        loadRateTableData();
        loadPackagingRateData();
    }
    
    private void loadRateTableData() {
        try {
            ClassPathResource resource = new ClassPathResource("data/rate_table.csv");
            BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream()));
            
            // Skip header
            String line = reader.readLine();
            
            while ((line = reader.readLine()) != null) {
                String[] values = line.split(",");
                if (values.length >= 4) {
                    RateTable rate = new RateTable();
                    rate.setProduct(values[0].trim());
                    rate.setTrimType(values[1].trim());
                    rate.setRmSpec(values[2].trim());
                    rate.setRatePerKg(Double.parseDouble(values[3].trim()));
                    rateTableData.add(rate);
                }
            }
            
            reader.close();
        } catch (IOException e) {
            throw new RuntimeException("Failed to load rate table data", e);
        }
    }
    
    private void loadPackagingRateData() {
        try {
            ClassPathResource resource = new ClassPathResource("data/pack_table.csv");
            BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream()));
            
            // Skip header
            String line = reader.readLine();
            
            while ((line = reader.readLine()) != null) {
                String[] values = line.split(",");
                if (values.length >= 5) {
                    PackagingRate packagingRate = new PackagingRate();
                    packagingRate.setProdType(values[0].trim());
                    packagingRate.setProduct(values[1].trim());
                    
                    // The pack_type in the CSV is what we need to use for both boxQty and pack
                    String packType = values[2].trim();
                    packagingRate.setBoxQty(packType);
                    packagingRate.setPack(packType);
                    
                    packagingRate.setTransportMode(values[3].trim());
                    packagingRate.setPackagingRate(Double.parseDouble(values[4].trim()));
                    packagingRateData.add(packagingRate);
                }
            }
            
            reader.close();
        } catch (IOException e) {
            throw new RuntimeException("Failed to load packaging rate data", e);
        }
    }
    
    public Double calculateFilingRate(String product, String trimType, String rmSpec) {
        return rateTableData.stream()
                .filter(rate -> rate.getProduct().equalsIgnoreCase(product)
                        && rate.getTrimType().equalsIgnoreCase(trimType)
                        && rate.getRmSpec().equalsIgnoreCase(rmSpec))
                .findFirst()
                .map(RateTable::getRatePerKg)
                .orElse(null);
    }
    
    public Double calculatePackagingRate(String prodType, String product, String packType, String transportMode) {
        return packagingRateData.stream()
                .filter(rate -> rate.getProdType().equalsIgnoreCase(prodType)
                        && rate.getProduct().equalsIgnoreCase(product)
                        && rate.getPack().equalsIgnoreCase(packType)
                        && rate.getTransportMode().equalsIgnoreCase(transportMode))
                .findFirst()
                .map(PackagingRate::getPackagingRate)
                .orElse(null);
    }
    
    public List<String> getProductOptions() {
        return rateTableData.stream()
                .map(RateTable::getProduct)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<String> getTrimTypes(String product) {
        return rateTableData.stream()
                .filter(rate -> rate.getProduct().equalsIgnoreCase(product))
                .map(RateTable::getTrimType)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<String> getRmSpecs() {
        return rateTableData.stream()
                .map(RateTable::getRmSpec)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<String> getProdTypes() {
        return packagingRateData.stream()
                .map(PackagingRate::getProdType)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<String> getPackagingTypes(String product, String prodType) {
        return packagingRateData.stream()
                .filter(rate -> rate.getProduct().equalsIgnoreCase(product)
                        && rate.getProdType().equalsIgnoreCase(prodType))
                .map(PackagingRate::getPack)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<String> getPackagingSizes(String product, String prodType) {
        return packagingRateData.stream()
                .filter(rate -> rate.getProduct().equalsIgnoreCase(product)
                        && rate.getProdType().equalsIgnoreCase(prodType))
                .map(PackagingRate::getBoxQty)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<String> getTransportModes() {
        return packagingRateData.stream()
                .map(PackagingRate::getTransportMode)
                .distinct()
                .collect(Collectors.toList());
    }
}