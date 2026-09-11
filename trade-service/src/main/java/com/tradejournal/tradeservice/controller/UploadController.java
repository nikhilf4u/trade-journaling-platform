package com.tradejournal.tradeservice.controller;

import com.tradejournal.commonlibrary.dto.ApiResponse;
import com.tradejournal.commonlibrary.security.JwtUtil;
import com.tradejournal.tradeservice.entity.Trade;
import com.tradejournal.tradeservice.entity.TradeScreenshot;
import com.tradejournal.tradeservice.service.TradeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    private final TradeService tradeService;
    private final JwtUtil jwtUtil;

    @Value("${upload.dir}")
    private String uploadDir;

    private Long getUserIdFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        return jwtUtil.extractUserId(authHeader);
    }

    /**
     * ⭐ Upload MULTIPLE screenshots at once
     */
    @PostMapping("/{tradeId}/screenshots")
    public ResponseEntity<?> uploadScreenshots(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long tradeId,
            @RequestParam("files") MultipartFile[] files) {

        Long userId = getUserIdFromHeader(authHeader);

        Trade trade = tradeService.getTradeById(tradeId);
        if (!trade.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You do not own this trade."));
        }

        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("No files provided."));
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            List<Map<String, String>> uploaded = new ArrayList<>();

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) continue;

                String originalFilename = file.getOriginalFilename();
                String extension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String filename = "trade_" + tradeId + "_" + UUID.randomUUID() + extension;
                Path filePath = uploadPath.resolve(filename);

                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                String fileUrl = "http://localhost:8082/uploads/" + filename;
                String label = originalFilename != null ? originalFilename : "Screenshot";

                // Persist each screenshot to the trade_screenshots table
                TradeScreenshot saved = tradeService.addScreenshot(tradeId, fileUrl, label);

                uploaded.add(Map.of(
                        "id", String.valueOf(saved.getId()),
                        "url", fileUrl,
                        "label", label
                ));
            }

            log.info("📸 {} screenshots uploaded for trade ID: {}", uploaded.size(), tradeId);

            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("uploaded", uploaded),
                    uploaded.size() + " screenshot(s) uploaded"
            ));

        } catch (IOException e) {
            log.error("Failed to save files", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to save files: " + e.getMessage()));
        }
    }

    /**
     * ⭐ Delete a specific screenshot
     */
    @DeleteMapping("/{tradeId}/screenshots/{screenshotId}")
    public ResponseEntity<?> deleteScreenshot(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long tradeId,
            @PathVariable Long screenshotId) {

        Long userId = getUserIdFromHeader(authHeader);
        Trade trade = tradeService.getTradeById(tradeId);
        if (!trade.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You do not own this trade."));
        }

        tradeService.deleteScreenshot(tradeId, screenshotId);
        return ResponseEntity.ok(ApiResponse.success(null, "Screenshot deleted"));
    }
}