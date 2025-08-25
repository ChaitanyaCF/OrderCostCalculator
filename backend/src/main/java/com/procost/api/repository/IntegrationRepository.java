package com.procost.api.repository;

import com.procost.api.model.Integration;
import com.procost.api.model.IntegrationStatus;
import com.procost.api.model.IntegrationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, Long> {
    
    /**
     * Find integrations by status
     */
    List<Integration> findByStatus(IntegrationStatus status);
    
    /**
     * Find integrations by type
     */
    List<Integration> findByType(IntegrationType type);
    
    /**
     * Find active integrations that support a specific entity type
     */
    @Query("SELECT i FROM Integration i WHERE i.status = 'ACTIVE' AND i.supportedEntities LIKE %:entityType%")
    List<Integration> findActiveIntegrationsForEntity(@Param("entityType") String entityType);
    
    /**
     * Find integrations that need sync (pull-based)
     */
    @Query("SELECT i FROM Integration i WHERE i.status = 'ACTIVE' AND i.type IN ('API_PULL', 'BIDIRECTIONAL') " +
           "AND (i.lastSyncAt IS NULL OR i.lastSyncAt < :cutoffTime)")
    List<Integration> findIntegrationsNeedingSync(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    /**
     * Find integration by name (case-insensitive)
     */
    Optional<Integration> findByNameIgnoreCase(String name);
    
    /**
     * Find integrations by external system name
     */
    List<Integration> findByExternalSystemNameIgnoreCase(String externalSystemName);
    
    /**
     * Find integrations created by a specific user
     */
    List<Integration> findByCreatedBy(String createdBy);
    
    /**
     * Count integrations by status
     */
    long countByStatus(IntegrationStatus status);
    
    /**
     * Count integrations by type
     */
    long countByType(IntegrationType type);
    
    /**
     * Find integrations with recent activity
     */
    @Query("SELECT i FROM Integration i WHERE i.lastSyncAt >= :since ORDER BY i.lastSyncAt DESC")
    List<Integration> findRecentlyActive(@Param("since") LocalDateTime since);
    
    /**
     * Count integrations with recent activity
     */
    @Query("SELECT COUNT(i) FROM Integration i WHERE i.lastSyncAt >= :since")
    long countRecentlyActive(@Param("since") LocalDateTime since);
}
