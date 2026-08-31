package com.arthova.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "date_of_birth")
    private java.sql.Timestamp dateOfBirth;

    private String country;
    private String currency;
    private String profession;
    
    @Column(name = "income_bracket")
    private String incomeBracket;
    
    @Column(name = "risk_tolerance")
    private String riskTolerance;

    @Column(name = "profile_metadata", columnDefinition = "jsonb")
    private String profileMetadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
