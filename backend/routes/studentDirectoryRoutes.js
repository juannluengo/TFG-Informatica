// Purpose: Defines API endpoints for StudentDirectory interactions

import express from 'express';
import * as studentDirectoryController from '../controllers/studentDirectoryController.js';
import * as studentDirectoryService from '../services/studentDirectoryService.js';

const router = express.Router();

// Register a new student
router.post('/register', studentDirectoryController.registerStudent);

// Update an existing student
router.put('/update', studentDirectoryController.updateStudent);

// Deactivate a student
router.put('/deactivate', studentDirectoryController.deactivateStudent);

// Reactivate a student
router.put('/reactivate', studentDirectoryController.reactivateStudent);

// Get student information
router.get('/student/:studentAddress', studentDirectoryController.getStudent);

// Check if a student is registered
router.get('/isRegistered/:studentAddress', studentDirectoryController.isStudentRegistered);

// Get all students (paginated)
router.get('/all', studentDirectoryController.getAllStudents);

export default router; 