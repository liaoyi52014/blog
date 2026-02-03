package com.blog.service;

import com.blog.model.entity.User;
import com.blog.repository.UserRepository;
import com.blog.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Check if an admin account exists
     */
    public boolean hasAdmin() {
        return userRepository.count() > 0;
    }

    /**
     * Setup the first admin account (only allowed once)
     */
    @Transactional
    public String setupAdmin(String username, String password) {
        if (hasAdmin()) {
            throw new IllegalStateException("管理员账号已存在，不能重复创建");
        }

        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("用户名不能为空");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("密码长度至少6位");
        }

        String passwordHash = passwordEncoder.encode(password);
        User admin = new User(username.trim(), passwordHash);
        userRepository.save(admin);

        return jwtUtil.generateToken(username);
    }

    /**
     * Login with username and password
     */
    @Transactional
    public Optional<String> login(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(password, user.getPasswordHash()))
                .map(user -> {
                    user.setLastLoginAt(LocalDateTime.now());
                    userRepository.save(user);
                    return jwtUtil.generateToken(user.getUsername());
                });
    }

    /**
     * Get user by username
     */
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Validate token and get username
     */
    public Optional<String> validateToken(String token) {
        if (token == null || !jwtUtil.validateToken(token)) {
            return Optional.empty();
        }
        return Optional.of(jwtUtil.extractUsername(token));
    }

    public long getTokenExpirationMs() {
        return jwtUtil.getExpirationMs();
    }
}
