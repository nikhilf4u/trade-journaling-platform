package com.tradejournal.userservice.controller;

import com.tradejournal.commonlibrary.dto.ApiResponse;
import com.tradejournal.commonlibrary.security.JwtUtil;
import com.tradejournal.userservice.dto.LoginRequest;
import com.tradejournal.userservice.dto.RegisterRequest;
import com.tradejournal.userservice.entity.User;
import com.tradejournal.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("error", "Email already registered"));
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .baseCurrency(request.getBaseCurrency() != null ? request.getBaseCurrency() : "USD")
                .totalCapital(request.getTotalCapital() != null ? request.getTotalCapital() : java.math.BigDecimal.valueOf(10000))
                .riskPerTradePercent(request.getRiskPerTradePercent() != null ? request.getRiskPerTradePercent() : java.math.BigDecimal.valueOf(1.0))
                .maxDailyLossPercent(request.getMaxDailyLossPercent() != null ? request.getMaxDailyLossPercent() : java.math.BigDecimal.valueOf(3.0))
                .maxDrawdownPercent(request.getMaxDrawdownPercent() != null ? request.getMaxDrawdownPercent() : java.math.BigDecimal.valueOf(10.0))
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("email", user.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        response.put("baseCurrency", user.getBaseCurrency());
        response.put("totalCapital", user.getTotalCapital());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
            userRepository.save(user);
            // Print to console for local testing – in production, send via email
            System.out.println("=========================================");
            System.out.println("🔐 RESET PASSWORD LINK:");
            System.out.println("http://localhost:5173/reset-password?token=" + token);
            System.out.println("=========================================");
        });
        return ResponseEntity.ok(ApiResponse.success("message", "If an account exists, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (user.getResetTokenExpiry().isBefore(Instant.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("error", "Token has expired"));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("message", "Password reset successfully. Please login."));
    }
}