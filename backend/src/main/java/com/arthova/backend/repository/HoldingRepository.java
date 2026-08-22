package com.arthova.backend.repository;

import com.arthova.backend.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, UUID> {
    List<Holding> findByUserId(UUID userId);
    Optional<Holding> findByUserIdAndSymbol(UUID userId, String symbol);
    List<Holding> findByUserIdAndAssetType(UUID userId, com.arthova.backend.entity.AssetType assetType);
}
