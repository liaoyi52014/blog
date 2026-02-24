package com.blog.service;

import com.blog.model.dto.ScheduleCreateRequest;
import com.blog.model.entity.Schedule;
import com.blog.repository.ScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    public ScheduleService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    public List<Schedule> listByDate(LocalDate date) {
        return scheduleRepository.findByDate(date);
    }

    public List<Schedule> listTodayPending() {
        return scheduleRepository.findAllPending();
    }

    public List<Schedule> listByDateRange(LocalDate start, LocalDate end) {
        return scheduleRepository.findByDateRange(start, end);
    }

    public List<Schedule> listByProjectId(Long projectId) {
        return scheduleRepository.findByProjectIdOrderByScheduleDateAscCreatedAtAsc(projectId);
    }

    public List<Schedule> listActiveByProjectId(Long projectId) {
        return scheduleRepository.findActiveByProjectId(projectId);
    }

    public Optional<Schedule> getById(Long id) {
        return scheduleRepository.findById(id);
    }

    @Transactional
    public Schedule create(ScheduleCreateRequest request) {
        Schedule schedule = new Schedule();
        schedule.setTitle(request.getTitle());
        schedule.setDescription(request.getDescription());
        schedule.setScheduleDate(request.getScheduleDate());
        schedule.setEndDate(request.getEndDate());
        schedule.setProjectId(request.getProjectId());
        schedule.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        schedule.setStatus("PENDING");
        return scheduleRepository.save(schedule);
    }

    @Transactional
    public Optional<Schedule> updateStatus(Long id, String status) {
        return scheduleRepository.findById(id).map(schedule -> {
            schedule.setStatus(status);
            return scheduleRepository.save(schedule);
        });
    }

    @Transactional
    public Optional<Schedule> update(Long id, Schedule updated) {
        return scheduleRepository.findById(id).map(schedule -> {
            if (updated.getTitle() != null) {
                schedule.setTitle(updated.getTitle());
            }
            if (updated.getDescription() != null) {
                schedule.setDescription(updated.getDescription());
            }
            if (updated.getScheduleDate() != null) {
                schedule.setScheduleDate(updated.getScheduleDate());
            }
            if (updated.getEndDate() != null) {
                schedule.setEndDate(updated.getEndDate());
            }
            if (updated.getProjectId() != null) {
                schedule.setProjectId(updated.getProjectId());
            }
            if (updated.getStatus() != null) {
                schedule.setStatus(updated.getStatus());
            }
            if (updated.getPriority() != null) {
                schedule.setPriority(updated.getPriority());
            }
            return scheduleRepository.save(schedule);
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (scheduleRepository.existsById(id)) {
            scheduleRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
