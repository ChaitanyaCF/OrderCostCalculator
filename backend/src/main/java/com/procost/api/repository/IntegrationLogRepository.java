package com.procost.api.repository;

import com.procost.api.model.Integration;
import com.procost.api.model.IntegrationLog;
import com.procost.api.model.LogLevel;
import com.procost.api.model.OperationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IntegrationLogRepository extends JpaRepository<IntegrationLog, Long> {
    
    /**
     * Find logs by integration
     */
    Page<IntegrationLog> findByIntegrationOrderByCreatedAtDesc(Integration integration, Pageable pageable);
    
    /**
     * Find logs by integration and level
     */
    List<IntegrationLog> findByIntegrationAndLevel(Integration integration, LogLevel level);
    
    /**
     * Find logs by integration and operation type
     */
    List<IntegrationLog> findByIntegrationAndOperation(Integration integration, OperationType operation);
    
    /**
     * Find recent logs for an integration
     */
    @Query("SELECT l FROM IntegrationLog l WHERE l.integration = :integration AND l.createdAt >= :since ORDER BY l.createdAt DESC")
    List<IntegrationLog> findRecentLogs(@Param("integration") Integration integration, @Param("since") LocalDateTime since);
    
    /**
     * Find error logs for an integration
     */
    @Query("SELECT l FROM IntegrationLog l WHERE l.integration = :integration AND l.level = 'ERROR' ORDER BY l.createdAt DESC")
    List<IntegrationLog> findErrorLogs(@Param("integration") Integration integration);
    
    /**
     * Count logs by level for an integration
     */
    long countByIntegrationAndLevel(Integration integration, LogLevel level);
    
    /**
     * Find logs by entity
     */
    List<IntegrationLog> findByEntityTypeAndEntityId(String entityType, Long entityId);
    
    /**
     * Get integration statistics
     */
    @Query("SELECT l.operation, COUNT(l), AVG(l.executionTimeMs) FROM IntegrationLog l " +
           "WHERE l.integration = :integration AND l.createdAt >= :since " +
           "GROUP BY l.operation")
    List<Object[]> getIntegrationStats(@Param("integration") Integration integration, @Param("since") LocalDateTime since);
    
    /**
     * Delete old logs (for cleanup)
     */
    void deleteByCreatedAtBefore(LocalDateTime cutoffDate);
}
