import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Typography, 
    Box, 
    Button, 
    TextField, 
    Paper, 
    Grid, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    TablePagination,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
    Snackbar,
    Alert,
    AlertTitle,
    Card,
    CardContent,
    Divider,
    Chip,
    Link
} from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';
import * as studentDirectoryService from '../services/studentDirectoryService';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BugReportIcon from '@mui/icons-material/BugReport';

const StudentDirectory = () => {
    const { account, isAdmin, studentDirectoryContract } = useWeb3();
    
    // State for student list
    const [students, setStudents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    
    // Connection status
    const [connectionError, setConnectionError] = useState(false);
    const [contractStatus, setContractStatus] = useState(null);
    const [diagnosticResults, setDiagnosticResults] = useState(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    
    // State for registration/update form
    const [openForm, setOpenForm] = useState(false);
    const [formMode, setFormMode] = useState('register'); // 'register' or 'update'
    const [formData, setFormData] = useState({
        studentAddress: '',
        name: '',
        surname: '',
        secondSurname: '',
        studies: ''
    });
    const [privateKey, setPrivateKey] = useState('');
    
    // State for student details view
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [openDetails, setOpenDetails] = useState(false);
    
    // State for notifications
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    
    // Check contract status on component mount
    useEffect(() => {
        checkContractStatus();
    }, [studentDirectoryContract]);
    
    // Load students on component mount and when page/rowsPerPage changes
    useEffect(() => {
        if (!connectionError && studentDirectoryContract) {
            fetchStudents();
        }
    }, [page, rowsPerPage, connectionError, studentDirectoryContract]);
    
    // Run frontend diagnostics
    const runFrontendDiagnostics = async () => {
        setLoading(true);
        try {
            const results = await studentDirectoryService.diagnoseFrontendConnection();
            console.log('Diagnostic results:', results);
            setDiagnosticResults(results);
            setShowDiagnostics(true);
        } catch (error) {
            console.error('Error running diagnostics:', error);
            showNotification('Error running diagnostics: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Check contract connection status
    const checkContractStatus = async () => {
        try {
            if (!studentDirectoryContract) {
                setConnectionError(true);
                showNotification('Cannot connect to Student Directory contract. Please check your connection.', 'error');
                return;
            }

            // Test if we can call a method on the contract
            try {
                const count = await studentDirectoryContract.getStudentCount();
                console.log('Student count:', count.toString());
                setConnectionError(false);
            } catch (error) {
                console.error('Error testing contract:', error);
                setConnectionError(true);
                showNotification('Cannot connect to Student Directory contract. Please check your connection.', 'error');
            }
        } catch (error) {
            console.error('Error checking contract status:', error);
            setConnectionError(true);
            showNotification('Error connecting to contract: ' + error.message, 'error');
        }
    };
    
    // Fetch students from the contract
    const fetchStudents = async () => {
        if (!studentDirectoryContract) return;
        
        setLoading(true);
        try {
            // Get total count of students
            const count = await studentDirectoryContract.getStudentCount();
            const totalCount = Number(count);
            setTotalCount(totalCount);

            // If there are no students, return early
            if (totalCount === 0) {
                setStudents([]);
                setConnectionError(false);
                setLoading(false);
                return;
            }

            // Calculate start and end indices for pagination
            const start = page * rowsPerPage;
            // If start index is beyond total count, reset to first page
            if (start >= totalCount) {
                setPage(0);
                return;
            }
            const end = Math.min(start + rowsPerPage, totalCount);
            
            // Get batch of student addresses
            const addresses = await studentDirectoryContract.getStudentAddressesBatch(start, end - start);
            
            // Get details for each student
            const studentsData = await Promise.all(
                addresses.map(async (address) => {
                    try {
                        const student = await studentDirectoryContract.getStudent(address);
                        return {
                            address,
                            name: student.name,
                            surname: student.surname,
                            secondSurname: student.secondSurname,
                            studies: student.studies,
                            active: student.active
                        };
                    } catch (error) {
                        console.error(`Error fetching student ${address}:`, error);
                        return null;
                    }
                })
            );

            // Filter out any null values and sort
            const validStudents = studentsData.filter(s => s !== null).sort((a, b) => {
                const surnameComparison = a.surname?.localeCompare(b.surname || '') || 0;
                if (surnameComparison !== 0) return surnameComparison;
                return (a.name?.localeCompare(b.name || '') || 0);
            });

            setStudents(validStudents);
            setConnectionError(false);
        } catch (error) {
            console.error('Error fetching students:', error);
            showNotification('Error fetching students: ' + error.message, 'error');
            setConnectionError(true);
        } finally {
            setLoading(false);
        }
    };
    
    // Retry connection and refresh data
    const handleRetry = async () => {
        setLoading(true);
        await checkContractStatus();
        if (!connectionError) {
            await fetchStudents();
        }
        setLoading(false);
    };
    
    // Close diagnostics panel
    const handleCloseDiagnostics = () => {
        setShowDiagnostics(false);
    };
    
    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    
    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    
    // Open registration form
    const handleOpenRegisterForm = () => {
        setFormMode('register');
        setFormData({
            studentAddress: '',
            name: '',
            surname: '',
            secondSurname: '',
            studies: ''
        });
        setPrivateKey('');
        setOpenForm(true);
    };
    
    // Open update form with pre-filled data
    const handleOpenUpdateForm = (student) => {
        setFormMode('update');
        setFormData({
            studentAddress: student.address,
            name: student.name,
            surname: student.surname,
            secondSurname: student.secondSurname,
            studies: student.studies
        });
        setPrivateKey('');
        setOpenForm(true);
    };
    
    // Close form
    const handleCloseForm = () => {
        setOpenForm(false);
    };
    
    // Handle form input changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    // Handle private key input change
    const handlePrivateKeyChange = (e) => {
        setPrivateKey(e.target.value);
    };
    
    // Submit form (register or update)
    const handleSubmitForm = async () => {
        if (!studentDirectoryContract) {
            showNotification('Contract not initialized', 'error');
            return;
        }

        setLoading(true);
        try {
            const { studentAddress, name, surname, secondSurname, studies } = formData;

            if (formMode === 'register') {
                const tx = await studentDirectoryContract.registerStudent(
                    studentAddress,
                    name,
                    surname,
                    secondSurname || '',
                    studies
                );
                await tx.wait();
                showNotification('Student registered successfully', 'success');
            } else {
                const tx = await studentDirectoryContract.updateStudent(
                    studentAddress,
                    name,
                    surname,
                    secondSurname || '',
                    studies
                );
                await tx.wait();
                showNotification('Student updated successfully', 'success');
            }

            handleCloseForm();
            fetchStudents();
        } catch (error) {
            console.error('Error submitting form:', error);
            showNotification('Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // View student details
    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setOpenDetails(true);
    };
    
    // Close student details
    const handleCloseDetails = () => {
        setOpenDetails(false);
        setSelectedStudent(null);
    };
    
    // Show notification
    const showNotification = (message, severity) => {
        setNotification({
            open: true,
            message,
            severity
        });
    };
    
    // Close notification
    const handleCloseNotification = () => {
        setNotification({
            ...notification,
            open: false
        });
    };
    
    // Handle student deactivation
    const handleDeactivateStudent = async (studentAddress) => {
        if (!studentDirectoryContract) {
            showNotification('Contract not initialized', 'error');
            return;
        }

        setLoading(true);
        try {
            const tx = await studentDirectoryContract.deactivateStudent(studentAddress);
            await tx.wait();
            showNotification('Student deactivated successfully', 'success');
            fetchStudents();
        } catch (error) {
            console.error('Error deactivating student:', error);
            showNotification('Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle student reactivation
    const handleReactivateStudent = async (studentAddress) => {
        if (!studentDirectoryContract) {
            showNotification('Contract not initialized', 'error');
            return;
        }

        setLoading(true);
        try {
            const tx = await studentDirectoryContract.reactivateStudent(studentAddress);
            await tx.wait();
            showNotification('Student reactivated successfully', 'success');
            fetchStudents();
        } catch (error) {
            console.error('Error reactivating student:', error);
            showNotification('Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Container maxWidth="lg">
            <Box my={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Student Directory
                </Typography>
                <Typography variant="body1" paragraph>
                    This directory helps you associate students with their Ethereum addresses.
                    Browse the list of students or register new ones if you have admin privileges.
                </Typography>
                
                {connectionError && (
                    <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#fff8e1', border: '1px solid #ffe57f' }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <ErrorOutlineIcon color="warning" sx={{ mr: 1 }} />
                            <Typography variant="h6" color="warning.dark">
                                Connection Issue Detected
                            </Typography>
                        </Box>
                        <Typography variant="body1" paragraph>
                            Cannot connect to the Student Directory blockchain contract. This may be because:
                        </Typography>
                        <ul>
                            <li>The blockchain node is not running</li>
                            <li>The contract address is incorrect</li>
                            <li>The blockchain network has changed</li>
                        </ul>
                        <Box mt={2} display="flex" flexWrap="wrap" gap={2}>
                            <Button 
                                variant="contained" 
                                color="warning" 
                                startIcon={<RefreshIcon />}
                                onClick={handleRetry}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Retry Connection'}
                            </Button>
                            
                            <Button 
                                variant="outlined" 
                                color="info" 
                                startIcon={<BugReportIcon />}
                                onClick={runFrontendDiagnostics}
                                disabled={loading}
                            >
                                Run Frontend Diagnostics
                            </Button>
                            
                            {isAdmin && (
                                <Button 
                                    variant="outlined" 
                                    color="primary" 
                                    onClick={handleOpenRegisterForm}
                                    disabled={loading}
                                >
                                    Register New Student Anyway
                                </Button>
                            )}
                        </Box>
                    </Paper>
                )}
                
                {showDiagnostics && diagnosticResults && (
                    <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <BugReportIcon color="info" sx={{ mr: 1 }} />
                            <Typography variant="h6" color="info.dark">
                                Frontend Diagnostics Results
                            </Typography>
                        </Box>
                        
                        <Typography variant="subtitle1" gutterBottom>
                            API Base URL: {studentDirectoryService.API_BASE_URL}
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Health Status
                                        </Typography>
                                        <Chip 
                                            label={diagnosticResults.success ? "Connected" : "Failed"} 
                                            color={diagnosticResults.success ? "success" : "error"} 
                                            sx={{ mb: 2 }}
                                        />
                                        {diagnosticResults.error && (
                                            <Alert severity="error" sx={{ mt: 2 }}>
                                                {diagnosticResults.error}
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            {diagnosticResults.results?.diagnostics && (
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Contract Status
                                            </Typography>
                                            
                                            {diagnosticResults.results.diagnostics.studentDirectory && (
                                                <>
                                                    <Typography variant="body2" gutterBottom>
                                                        <strong>Address:</strong> {diagnosticResults.results.diagnostics.studentDirectory.address}
                                                    </Typography>
                                                    <Typography variant="body2" gutterBottom>
                                                        <strong>Has Code:</strong> {diagnosticResults.results.diagnostics.studentDirectory.hasCode ? "Yes" : "No"}
                                                    </Typography>
                                                    <Typography variant="body2" gutterBottom>
                                                        <strong>ABI Compatible:</strong> {diagnosticResults.results.diagnostics.studentDirectory.isABICompatible ? "Yes" : "No"}
                                                    </Typography>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                        
                        <Box mt={2} display="flex" justifyContent="flex-end">
                            <Button onClick={handleCloseDiagnostics} color="primary">
                                Close Diagnostics
                            </Button>
                        </Box>
                    </Paper>
                )}
                
                {isAdmin && !connectionError && (
                    <Box mb={3}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleOpenRegisterForm}
                            disabled={loading}
                        >
                            Register New Student
                        </Button>
                    </Box>
                )}
                
                {loading && (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                )}
                
                {!loading && students.length === 0 ? (
                    <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6">
                            No students found in the directory.
                        </Typography>
                        {isAdmin && !connectionError && (
                            <Typography variant="body2" color="textSecondary" mt={1}>
                                Click "Register New Student" to add the first student.
                            </Typography>
                        )}
                        {!isAdmin && !connectionError && (
                            <Typography variant="body2" color="textSecondary" mt={1}>
                                Contact an administrator to register students.
                            </Typography>
                        )}
                        {!loading && (
                            <Button 
                                startIcon={<RefreshIcon />}
                                onClick={handleRetry}
                                sx={{ mt: 2 }}
                            >
                                Refresh List
                            </Button>
                        )}
                    </Paper>
                ) : !loading && (
                    <>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Name</strong></TableCell>
                                        <TableCell><strong>Surname</strong></TableCell>
                                        <TableCell><strong>Second Surname</strong></TableCell>
                                        <TableCell><strong>Studies</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                        <TableCell><strong>Actions</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.address}>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>{student.surname}</TableCell>
                                            <TableCell>{student.secondSurname || '-'}</TableCell>
                                            <TableCell>{student.studies}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={student.active ? 'Active' : 'Inactive'} 
                                                    color={student.active ? 'success' : 'error'} 
                                                    size="small" 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant="outlined" 
                                                    size="small" 
                                                    onClick={() => handleViewStudent(student)}
                                                    sx={{ mr: 1, mb: { xs: 1, md: 0 } }}
                                                >
                                                    View
                                                </Button>
                                                {isAdmin && (
                                                    <>
                                                        <Button 
                                                            variant="outlined" 
                                                            color="primary" 
                                                            size="small" 
                                                            onClick={() => handleOpenUpdateForm(student)}
                                                            sx={{ mr: 1, mb: { xs: 1, md: 0 } }}
                                                        >
                                                            Update
                                                        </Button>
                                                        {student.active ? (
                                                            <Button 
                                                                variant="outlined" 
                                                                color="error" 
                                                                size="small" 
                                                                onClick={() => handleDeactivateStudent(student.address)}
                                                            >
                                                                Deactivate
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                variant="outlined" 
                                                                color="success" 
                                                                size="small" 
                                                                onClick={() => handleReactivateStudent(student.address)}
                                                            >
                                                                Reactivate
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                        />
                    </>
                )}
                
                {/* Registration/Update Form Dialog */}
                <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {formMode === 'register' ? 'Register New Student' : 'Update Student'}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText paragraph>
                            {formMode === 'register' 
                                ? 'Enter the student information to register them in the directory.'
                                : 'Update the student information in the directory.'}
                        </DialogContentText>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    name="studentAddress"
                                    label="Ethereum Address"
                                    fullWidth
                                    value={formData.studentAddress}
                                    onChange={handleFormChange}
                                    disabled={formMode === 'update'}
                                    required
                                    helperText="Enter a valid Ethereum address (0x followed by 40 hexadecimal characters). Each student needs a unique address."
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="name"
                                    label="First Name"
                                    fullWidth
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="surname"
                                    label="First Surname"
                                    fullWidth
                                    value={formData.surname}
                                    onChange={handleFormChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="secondSurname"
                                    label="Second Surname (Optional)"
                                    fullWidth
                                    value={formData.secondSurname}
                                    onChange={handleFormChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="studies"
                                    label="Field of Study"
                                    fullWidth
                                    value={formData.studies}
                                    onChange={handleFormChange}
                                    required
                                    helperText="e.g., Computer Science, Mathematics, etc."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="privateKey"
                                    label="Admin Private Key"
                                    fullWidth
                                    type="password"
                                    value={privateKey}
                                    onChange={handlePrivateKeyChange}
                                    required
                                    helperText="Enter the private key of an admin account. This is needed to sign the transaction on the blockchain."
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseForm} color="primary">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmitForm} 
                            color="primary" 
                            variant="contained"
                            disabled={
                                loading || 
                                !formData.studentAddress || 
                                !formData.name || 
                                !formData.surname || 
                                !formData.studies || 
                                !privateKey
                            }
                        >
                            {loading ? <CircularProgress size={24} /> : (formMode === 'register' ? 'Register' : 'Update')}
                        </Button>
                    </DialogActions>
                </Dialog>
                
                {/* Student Details Dialog */}
                <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
                    {selectedStudent && (
                        <>
                            <DialogTitle>
                                Student Details
                            </DialogTitle>
                            <DialogContent>
                                <Card variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {selectedStudent.name} {selectedStudent.surname} {selectedStudent.secondSurname}
                                        </Typography>
                                        <Chip 
                                            label={selectedStudent.active ? 'Active' : 'Inactive'} 
                                            color={selectedStudent.active ? 'success' : 'error'} 
                                            size="small" 
                                            sx={{ mb: 2 }}
                                        />
                                        <Typography variant="body1" color="textSecondary" gutterBottom>
                                            <strong>Field of Study:</strong> {selectedStudent.studies}
                                        </Typography>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Typography variant="body2" color="textSecondary">
                                            <strong>Ethereum Address:</strong>
                                        </Typography>
                                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                            {selectedStudent.address}
                                        </Typography>
                                    </CardContent>
                                </Card>
                                <Typography variant="body2" color="textSecondary">
                                    This information helps connect the student's identity with their Ethereum address
                                    in the academic records system.
                                </Typography>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDetails} color="primary">
                                    Close
                                </Button>
                                {isAdmin && (
                                    <Button 
                                        onClick={() => {
                                            handleCloseDetails();
                                            handleOpenUpdateForm(selectedStudent);
                                        }} 
                                        color="primary"
                                    >
                                        Edit
                                    </Button>
                                )}
                            </DialogActions>
                        </>
                    )}
                </Dialog>
                
                {/* Notification Snackbar */}
                <Snackbar 
                    open={notification.open} 
                    autoHideDuration={6000} 
                    onClose={handleCloseNotification}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={handleCloseNotification} 
                        severity={notification.severity} 
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    );
};

export default StudentDirectory; 