package com.blog.repository;

import com.blog.model.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    // 查找某日的日程（包括跨天日程）
    @Query("SELECT s FROM Schedule s WHERE s.scheduleDate <= :date AND (s.endDate IS NULL AND s.scheduleDate = :date OR s.endDate >= :date) ORDER BY s.createdAt ASC")
    List<Schedule> findByDate(@Param("date") LocalDate date);

    // 查找日期范围内的日程（包括跨天日程）
    @Query("SELECT s FROM Schedule s WHERE s.scheduleDate <= :end AND (s.endDate IS NULL AND s.scheduleDate >= :start OR s.endDate >= :start) ORDER BY s.scheduleDate ASC, s.createdAt ASC")
    List<Schedule> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // 查找某日未完成的日程（包括跨天日程）
    @Query("SELECT s FROM Schedule s WHERE s.scheduleDate <= :date AND (s.endDate IS NULL AND s.scheduleDate = :date OR s.endDate >= :date) AND s.status <> 'COMPLETED' ORDER BY s.createdAt ASC")
    List<Schedule> findPendingByDate(@Param("date") LocalDate date);

    @Query("SELECT s FROM Schedule s WHERE (s.scheduleDate <= :date AND (s.endDate IS NULL OR s.endDate >= :date)) AND s.status <> 'COMPLETED' ORDER BY s.createdAt ASC")
    List<Schedule> findActiveByDate(@Param("date") LocalDate date);

    // 查找所有未完成的日程
    @Query("SELECT s FROM Schedule s WHERE s.status <> 'COMPLETED' ORDER BY s.scheduleDate ASC, s.createdAt ASC")
    List<Schedule> findAllPending();

    List<Schedule> findByProjectIdOrderByScheduleDateAscCreatedAtAsc(Long projectId);

    @Query("SELECT s FROM Schedule s WHERE s.projectId = :projectId AND s.status <> 'COMPLETED' ORDER BY s.scheduleDate ASC")
    List<Schedule> findActiveByProjectId(@Param("projectId") Long projectId);
}
