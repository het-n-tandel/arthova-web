package com.arthova.backend.controller;

import com.arthova.backend.dto.AIAllocationDTO.*;
import com.arthova.backend.service.AIAllocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AIAllocationController {

    @Autowired
    private AIAllocationService aiAllocationService;

    @PostMapping("/recommendation")
    public ResponseEntity<AIRecommendationResponse> getRecommendation(@RequestBody UserProfilePayload payload) {
        try {
            AIRecommendationResponse response = aiAllocationService.generateRecommendation(payload);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/profile/{userId}")
    public ResponseEntity<AIRecommendationResponse> saveProfileAndRecommend(
            @PathVariable UUID userId,
            @RequestBody UserProfilePayload payload) {
        try {
            aiAllocationService.saveUserProfile(userId, payload);
            AIRecommendationResponse response = aiAllocationService.generateRecommendation(payload);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
