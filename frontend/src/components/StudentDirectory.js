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
    Card,
    CardContent,
    Divider,
    Chip
} from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';
import * as studentDirectoryService from '../services/studentDirectoryService';

const StudentDirectory = () => {
    const { account, isAdmin } = useWeb3();
    
    // State for student list
    const [students, setStudents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    
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
    
    // Load students on component mount and when page/rowsPerPage changes
    useEffect(() => {
        fetchStudents();
    }, [page, rowsPerPage]);
    
    // Fetch students from the backend
    const fetchStudents = async () => {
        setLoading(true);
        try {
            const result = await studentDirectoryService.getAllStudents(page * rowsPerPage, rowsPerPage);
            if (result.success) {
                // Sort students alphabetically by surname, then name
                const sortedStudents = [...result.students].sort((a, b) => {
                    const surnameComparison = a.surname.localeCompare(b.surname);
                    if (surnameComparison !== 0) return surnameComparison;
                    return a.name.localeCompare(b.name);
                });
                
                setStudents(sortedStudents);
                setTotalCount(result.totalCount);
            } else {
                showNotification('Error fetching students: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            showNotification('Error fetching students', 'error');
        } finally {
            setLoading(false);
        }
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
        setLoading(true);
        try {
            console.log('Form submission started:', {
                mode: formMode,
                studentAddress: formData.studentAddress,
                name: formData.name,
                surname: formData.surname,
                privateKeyProvided: !!privateKey
            });
            
            // Ensure private key has 0x prefix
            const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
            console.log('Using formatted private key (first 6 chars):', formattedPrivateKey.substring(0, 6) + '...');
            
            let result;
            
            if (formMode === 'register') {
                result = await studentDirectoryService.registerStudent(formData, formattedPrivateKey);
            } else {
                result = await studentDirectoryService.updateStudent(formData, formattedPrivateKey);
            }
            
            console.log('Form submission result:', result);
            
            if (result.success) {
                showNotification(
                    `Student ${formMode === 'register' ? 'registered' : 'updated'} successfully!`,
                    'success'
                );
                handleCloseForm();
                fetchStudents();
            } else {
                // Provide more user-friendly error messages
                let errorMessage = result.error || 'An unknown error occurred';
                
                // Handle specific error cases
                if (errorMessage.includes('Student already registered')) {
                    errorMessage = 'This Ethereum address is already registered to a student. Please use a different address or update the existing student.';
                } else if (errorMessage.includes('Invalid Ethereum address format')) {
                    errorMessage = 'The Ethereum address format is invalid. Please enter a valid address starting with 0x followed by 40 hexadecimal characters.';
                } else if (errorMessage.includes('Student not registered')) {
                    errorMessage = 'This student is not registered in the system. Please register the student first.';
                } else if (errorMessage.includes('Contract not initialized with signer')) {
                    errorMessage = 'Authentication failed. Please check that you provided the correct admin private key.';
                } else if (errorMessage.includes('execution reverted')) {
                    // Extract the reason from the error message if possible
                    const reasonMatch = errorMessage.match(/reason="([^"]+)"/);
                    if (reasonMatch && reasonMatch[1]) {
                        errorMessage = `Blockchain error: ${reasonMatch[1]}`;
                    } else {
                        errorMessage = 'The transaction was rejected by the blockchain. Please check your inputs and try again.';
                    }
                }
                
                showNotification(
                    `Error ${formMode === 'register' ? 'registering' : 'updating'} student: ${errorMessage}`,
                    'error'
                );
            }
        } catch (error) {
            console.error(`Error ${formMode === 'register' ? 'registering' : 'updating'} student:`, error);
            
            // Provide a user-friendly error message
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            showNotification(
                `Error ${formMode === 'register' ? 'registering' : 'updating'} student: ${errorMessage}`,
                'error'
            );
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
    
    // Deactivate student
    const handleDeactivateStudent = async (student) => {
        if (!window.confirm(`Are you sure you want to deactivate ${student.name} ${student.surname}?`)) {
            return;
        }
        
        setLoading(true);
        try {
            // Ensure private key has 0x prefix
            const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
            
            const result = await studentDirectoryService.deactivateStudent(student.address, formattedPrivateKey);
            
            if (result.success) {
                showNotification('Student deactivated successfully!', 'success');
                fetchStudents();
            } else {
                // Provide more user-friendly error messages
                let errorMessage = result.error || 'An unknown error occurred';
                
                // Handle specific error cases
                if (errorMessage.includes('Student not registered')) {
                    errorMessage = 'This student is not registered in the system.';
                } else if (errorMessage.includes('Student already deactivated')) {
                    errorMessage = 'This student is already deactivated.';
                } else if (errorMessage.includes('Contract not initialized with signer')) {
                    errorMessage = 'Authentication failed. Please check that you provided the correct admin private key.';
                } else if (errorMessage.includes('execution reverted')) {
                    // Extract the reason from the error message if possible
                    const reasonMatch = errorMessage.match(/reason="([^"]+)"/);
                    if (reasonMatch && reasonMatch[1]) {
                        errorMessage = `Blockchain error: ${reasonMatch[1]}`;
                    } else {
                        errorMessage = 'The transaction was rejected by the blockchain. Please try again.';
                    }
                }
                
                showNotification('Error deactivating student: ' + errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error deactivating student:', error);
            showNotification('Error deactivating student: An unexpected error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Reactivate student
    const handleReactivateStudent = async (student) => {
        if (!window.confirm(`Are you sure you want to reactivate ${student.name} ${student.surname}?`)) {
            return;
        }
        
        setLoading(true);
        try {
            // Ensure private key has 0x prefix
            const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
            
            const result = await studentDirectoryService.reactivateStudent(student.address, formattedPrivateKey);
            
            if (result.success) {
                showNotification('Student reactivated successfully!', 'success');
                fetchStudents();
            } else {
                // Provide more user-friendly error messages
                let errorMessage = result.error || 'An unknown error occurred';
                
                // Handle specific error cases
                if (errorMessage.includes('Student not registered')) {
                    errorMessage = 'This student is not registered in the system.';
                } else if (errorMessage.includes('Student already active')) {
                    errorMessage = 'This student is already active.';
                } else if (errorMessage.includes('Contract not initialized with signer')) {
                    errorMessage = 'Authentication failed. Please check that you provided the correct admin private key.';
                } else if (errorMessage.includes('execution reverted')) {
                    // Extract the reason from the error message if possible
                    const reasonMatch = errorMessage.match(/reason="([^"]+)"/);
                    if (reasonMatch && reasonMatch[1]) {
                        errorMessage = `Blockchain error: ${reasonMatch[1]}`;
                    } else {
                        errorMessage = 'The transaction was rejected by the blockchain. Please try again.';
                    }
                }
                
                showNotification('Error reactivating student: ' + errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error reactivating student:', error);
            showNotification('Error reactivating student: An unexpected error occurred', 'error');
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
                
                {isAdmin && (
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
                        {isAdmin && (
                            <Typography variant="body2" color="textSecondary" mt={1}>
                                Use the "Register New Student" button to add students.
                            </Typography>
                        )}
                    </Paper>
                ) : (
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
                                                                onClick={() => handleDeactivateStudent(student)}
                                                            >
                                                                Deactivate
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                variant="outlined" 
                                                                color="success" 
                                                                size="small" 
                                                                onClick={() => handleReactivateStudent(student)}
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