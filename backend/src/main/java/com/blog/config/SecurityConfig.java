package com.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - auth
                        .requestMatchers("/api/auth/status", "/api/auth/setup", "/api/auth/login").permitAll()

                        // Public endpoints - read operations
                        .requestMatchers(HttpMethod.GET, "/api/articles/published").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/articles/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/news/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/knowledge").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/knowledge/**").permitAll()

                        // Public endpoints - search and chat (REMOVED - now protected)
                        // .requestMatchers("/api/search/**").permitAll()
                        // .requestMatchers("/api/chat/**").permitAll()

                        // Protected endpoints - require authentication
                        .requestMatchers("/api/search/**").authenticated()
                        .requestMatchers("/api/chat/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/articles/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/articles/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/articles/**").authenticated()
                        .requestMatchers("/api/import/**").authenticated()
                        .requestMatchers("/api/rss/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/knowledge/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/knowledge/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/knowledge/**").authenticated()
                        .requestMatchers("/api/auth/logout", "/api/auth/me").authenticated()

                        // Allow all other requests (adjust as needed)
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
