package com.procost.api.repository;

import com.procost.api.model.PackagingRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PackagingRateRepository extends JpaRepository<PackagingRate, Long> {
    
    @Modifying
    @Query("DELETE FROM PackagingRate pr WHERE pr.factory.id = :factoryId")
    int deleteAllByFactoryId(Long factoryId);
    
    @Query("SELECT pr FROM PackagingRate pr WHERE pr.factory.id = :factoryId")
    List<PackagingRate> findAllByFactoryId(Long factoryId);
} 