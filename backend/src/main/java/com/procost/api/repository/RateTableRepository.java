package com.procost.api.repository;

import com.procost.api.model.RateTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RateTableRepository extends JpaRepository<RateTable, Long> {
    
    @Modifying
    @Query("DELETE FROM RateTable rt WHERE rt.factory.id = :factoryId")
    int deleteAllByFactoryId(Long factoryId);
    
    @Query("SELECT rt FROM RateTable rt WHERE rt.factory.id = :factoryId")
    List<RateTable> findAllByFactoryId(Long factoryId);
} 