// Purpose: Contains functions to interact with the StudentDirectory backend API

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Add diagnostic helper
export const diagnoseFrontendConnection = async () => {
    try {
        console.log('Running frontend diagnostics...');
        console.log('Using API_BASE_URL:', API_BASE_URL);
        
        // Test basic connectivity
        console.log('Testing basic connectivity...');
        const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });
        
        if (!healthResponse.ok) {
            throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
        }
        
        const healthData = await healthResponse.json();
        console.log('Health check response:', healthData);
        
        // Test students endpoint
        console.log('Testing students endpoint...');
        try {
            const studentsResponse = await fetch(`${API_BASE_URL}/students/all`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            
            if (!studentsResponse.ok) {
                throw new Error(`Students endpoint failed: ${studentsResponse.status} ${studentsResponse.statusText}`);
            }
            
            const studentsData = await studentsResponse.json();
            console.log('Students endpoint response:', studentsData);
        } catch (error) {
            console.error('Students endpoint error:', error);
        }
        
        // Test contract diagnostics
        console.log('Testing contract diagnostics...');
        try {
            const diagResponse = await fetch(`${API_BASE_URL}/diagnostics/contract`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            
            if (!diagResponse.ok) {
                throw new Error(`Diagnostics endpoint failed: ${diagResponse.status} ${diagResponse.statusText}`);
            }
            
            const diagData = await diagResponse.json();
            console.log('Contract diagnostics response:', diagData);
            
            return {
                success: true,
                message: 'Diagnostic completed successfully',
                healthStatus: healthData.status,
                contractStatus: diagData.success ? 'Connected' : 'Failed',
                results: {
                    health: healthData,
                    diagnostics: diagData
                }
            };
        } catch (error) {
            console.error('Diagnostics endpoint error:', error);
            return {
                success: false,
                message: 'Diagnostic failed at diagnostics endpoint',
                error: error.message
            };
        }
    } catch (error) {
        console.error('Fatal diagnostic error:', error);
        return {
            success: false,
            message: 'Frontend diagnostic failed',
            error: error.message
        };
    }
};

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
        const url = `${API_BASE_URL}/students/all?startIndex=${startIndex}&count=${count}`;
        console.log('Attempting to fetch students from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            // Add a timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received student data:', data);
        return data;
    } catch (error) {
        console.error('Error getting all students:', error);
        return {
            success: false,
            error: error.message,
            students: [], // Return empty array for safety
            totalCount: 0
        };
    }
}; 