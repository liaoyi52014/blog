package com.blog.controller;

import com.blog.service.AuthService;
import com.blog.util.ApiResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String TOKEN_COOKIE_NAME = "auth_token";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Check if admin account exists
     */
    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> getStatus() {
        boolean hasAdmin = authService.hasAdmin();
        Map<String, Object> data = new HashMap<>();
        data.put("hasAdmin", hasAdmin);
        data.put("message", hasAdmin ? "请登录" : "请创建管理员账号");
        return ApiResponse.success(data);
    }

    /**
     * Setup admin account (first time only)
     */
    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setup(
            @RequestBody Map<String, String> request,
            HttpServletResponse response) {

        String username = request.get("username");
        String password = request.get("password");

        try {
            String token = authService.setupAdmin(username, password);
            setTokenCookie(response, token);

            Map<String, Object> data = new HashMap<>();
            data.put("success", true);
            data.put("message", "管理员账号创建成功");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure(400, e.getMessage()));
        }
    }

    /**
     * Login with username and password
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @RequestBody Map<String, String> request,
            HttpServletResponse response) {

        String username = request.get("username");
        String password = request.get("password");

        return authService.login(username, password)
                .map(token -> {
                    setTokenCookie(response, token);
                    Map<String, Object> data = new HashMap<>();
                    data.put("success", true);
                    data.put("message", "登录成功");
                    return ResponseEntity.ok(ApiResponse.success(data));
                })
                .orElseGet(() -> ResponseEntity.status(401)
                        .body(ApiResponse.failure(401, "用户名或密码错误")));
    }

    /**
     * Logout - clear cookie
     */
    @PostMapping("/logout")
    public ApiResponse<Map<String, Object>> logout(HttpServletResponse response) {
        clearTokenCookie(response);
        Map<String, Object> data = new HashMap<>();
        data.put("success", true);
        data.put("message", "已退出登录");
        return ApiResponse.success(data);
    }

    /**
     * Get current user info
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(
            @CookieValue(name = TOKEN_COOKIE_NAME, required = false) String token) {

        if (token == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.failure(401, "未登录"));
        }

        return authService.validateToken(token)
                .flatMap(authService::getUserByUsername)
                .map(user -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("username", user.getUsername());
                    data.put("role", user.getRole());
                    data.put("createdAt", user.getCreatedAt().toString());
                    return ResponseEntity.ok(ApiResponse.success(data));
                })
                .orElseGet(() -> ResponseEntity.status(401)
                        .body(ApiResponse.failure(401, "Token无效或已过期")));
    }

    private void setTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(TOKEN_COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge((int) (authService.getTokenExpirationMs() / 1000));
        response.addCookie(cookie);
    }

    private void clearTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(TOKEN_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
