package com.procost.api.repository;

import com.procost.api.model.ChargeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargeRateRepository extends JpaRepository<ChargeRate, Long> {
    
    List<ChargeRate> findByFactoryId(Long factoryId);
    
    @Query("SELECT cr FROM ChargeRate cr WHERE cr.factory.id = :factoryId AND cr.chargeName = :chargeName")
    List<ChargeRate> findByFactoryIdAndChargeName(@Param("factoryId") Long factoryId, @Param("chargeName") String chargeName);
    
    @Query("SELECT cr FROM ChargeRate cr WHERE cr.factory.id = :factoryId AND cr.productType = :productType")
    List<ChargeRate> findByFactoryIdAndProductType(@Param("factoryId") Long factoryId, @Param("productType") String productType);
    
    @Query("SELECT cr FROM ChargeRate cr WHERE cr.factory.id = :factoryId AND cr.product = :product")
    List<ChargeRate> findByFactoryIdAndProduct(@Param("factoryId") Long factoryId, @Param("product") String product);
    
    @Query("SELECT cr FROM ChargeRate cr WHERE cr.factory.id = :factoryId AND cr.chargeName = :chargeName AND cr.productType = :productType AND cr.product = :product")
    List<ChargeRate> findByFactoryIdAndChargeNameAndProductTypeAndProduct(
        @Param("factoryId") Long factoryId, 
        @Param("chargeName") String chargeName, 
        @Param("productType") String productType, 
        @Param("product") String product
    );
    
    @Query("SELECT cr FROM ChargeRate cr WHERE cr.factory.id = :factoryId AND cr.chargeName = :chargeName AND cr.productType = :productType AND cr.product = :product AND cr.subtype = :subtype")
    ChargeRate findSpecificChargeRate(
        @Param("factoryId") Long factoryId, 
        @Param("chargeName") String chargeName, 
        @Param("productType") String productType, 
        @Param("product") String product,
        @Param("subtype") String subtype
    );
} 