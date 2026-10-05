package com.example.urlshortener.repository;

import com.example.urlshortener.entity.Url;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UrlRepository extends JpaRepository<Url, Long> {

    Optional<Url> findByShortCode(String shortCode);

    Optional<Url> findFirstByLongUrlOrderByCreatedDateDesc(String longUrl);

    boolean existsByShortCode(String shortCode);

    List<Url> findAllByOrderByCreatedDateDesc();

    @Modifying
    @Query("""
            UPDATE Url u
            SET u.clickCount = u.clickCount + 1,
                u.lastAccessedDate = :accessedAt
            WHERE u.shortCode = :shortCode
            """)
    int incrementClickCount(@Param("shortCode") String shortCode, @Param("accessedAt") LocalDateTime accessedAt);
}
