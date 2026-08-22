package com.arthova.backend.repository;

import com.arthova.backend.entity.AssetTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AssetTransactionRepository extends JpaRepository<AssetTransaction, UUID> {
}
