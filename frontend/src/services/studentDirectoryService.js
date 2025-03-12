// Purpose: Contains functions to interact with the StudentDirectory backend API

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Register a new student
 * @param {Object} studentData - Student data including address, name, surname, secondSurname, studies
 * @param {string} privateKey - Private key for transaction signing
 * @returns {Promise<Object>} - API response
 */
export const registerStudent = async (studentData, privateKey) => {
    try {
        console.log('Sending registration request to backend:', {
            ...studentData,
            privateKeyProvided: !!privateKey
        });
        
        const response = await fetch(`${API_BASE_URL}/students/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...studentData,
                privateKey,
            }),
        });
        
        const data = await response.json();
        console.log('Registration response from backend:', data);
        
        return data;
    } catch (error) {
        console.error('Error registering student:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Update an existing student
 * @param {Object} studentData - Student data including address, name, surname, secondSurname, studies
 * @param {string} privateKey - Private key for transaction signing
 * @returns {Promise<Object>} - API response
 */
export const updateStudent = async (studentData, privateKey) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...studentData,
                privateKey,
            }),
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error updating student:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Deactivate a student
 * @param {string} studentAddress - Ethereum address of the student
 * @param {string} privateKey - Private key for transaction signing
 * @returns {Promise<Object>} - API response
 */
export const deactivateStudent = async (studentAddress, privateKey) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/deactivate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentAddress,
                privateKey,
            }),
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error deactivating student:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Reactivate a student
 * @param {string} studentAddress - Ethereum address of the student
 * @param {string} privateKey - Private key for transaction signing
 * @returns {Promise<Object>} - API response
 */
export const reactivateStudent = async (studentAddress, privateKey) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/reactivate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentAddress,
                privateKey,
            }),
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error reactivating student:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Get student information
 * @param {string} studentAddress - Ethereum address of the student
 * @returns {Promise<Object>} - API response
 */
export const getStudent = async (studentAddress) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/student/${studentAddress}`);
        return await response.json();
    } catch (error) {
        console.error('Error getting student:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Check if a student is registered
 * @param {string} studentAddress - Ethereum address of the student
 * @returns {Promise<Object>} - API response
 */
export const isStudentRegistered = async (studentAddress) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/isRegistered/${studentAddress}`);
        return await response.json();
    } catch (error) {
        console.error('Error checking if student is registered:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Get all students (paginated)
 * @param {number} startIndex - Starting index for pagination
 * @param {number} count - Number of students to retrieve
 * @returns {Promise<Object>} - API response
 */
export const getAllStudents = async (startIndex = 0, count = 10) => {
    try {
        const response = await fetch(`${API_BASE_URL}/students/all?startIndex=${startIndex}&count=${count}`);
        return await response.json();
    } catch (error) {
        console.error('Error getting all students:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}; 