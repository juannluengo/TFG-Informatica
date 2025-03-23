import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress,
  Typography,
  Box,
  Paper
} from '@mui/material';
import { ethers } from 'ethers';
import * as studentDirectoryService from '../services/studentDirectoryService';

const StudentAddressSelector = ({ 
  value, 
  onChange, 
  label = "Recipient Ethereum Address", 
  helperText, 
  disabled = false, 
  required = true, 
  fullWidth = true,
  disableStudentList = false  // Add new prop to disable student list
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Validate the address
  const isValidAddress = (address) => {
    return address === '' || ethers.isAddress(address);
  };

  // Set initial input value when value changes
  useEffect(() => {
    if (value) {
      setInputValue(value);
    }
  }, [value]);
  
  // Fetch all students when the component mounts
  useEffect(() => {
    // Skip fetching students if the list is disabled
    if (disableStudentList) {
      setHasAttemptedLoad(true);
      setOptions([]);
      return;
    }
    
    let isMounted = true; // Flag to prevent state updates after unmounting
    
    const fetchStudents = async () => {
      if (loading) return; // Prevent multiple simultaneous calls
      
      setLoading(true);
      setError(''); // Clear any previous errors
      
      try {
        console.log('Fetching students from API...');
        // Get all students (this could be optimized with pagination if there are many students)
        const response = await studentDirectoryService.getAllStudents(0, 100);
        console.log('API Response:', response);
        
        if (!isMounted) return; // Don't update state if component unmounted
        
        setHasAttemptedLoad(true); // Mark that we've attempted to load data
        
        // Check for a proper response with students array
        if (response.success && Array.isArray(response.students)) {
          if (response.students.length > 0) {
            // Format students for the dropdown
            const formattedStudents = response.students.map(student => ({
              address: student.address,
              label: `${student.name} ${student.surname} ${student.secondSurname || ''}`.trim(),
              studentData: student
            }));
            setOptions(formattedStudents);
            console.log(`Loaded ${formattedStudents.length} students for address selector`);
          } else {
            // No students found - this is normal for a new system
            console.log('No students found in directory');
            setOptions([]);
          }
        } else {
          // Handle API error but don't break the UI
          console.error('Error loading students:', response.error || 'Invalid response format');
          setError('Unable to load student directory');
          setOptions([]);
        }
      } catch (error) {
        // Handle any other errors
        if (!isMounted) return;
        console.error('Error loading students:', error);
        setError('Failed to connect to student directory');
        setOptions([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();
    
    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
    };
  }, []); // Only run on mount

  // Helper to find the option matching the current value
  const getSelectedOption = () => {
    if (!value || disableStudentList) return null;
    return options.find(option => option.address.toLowerCase() === value.toLowerCase()) || null;
  };

  // When value changes externally, update validation status
  useEffect(() => {
    if (value) {
      setValidationError(!isValidAddress(value));
    } else {
      setValidationError(false);
    }
  }, [value]);

  // Determine which helper text to show
  const getHelperText = () => {
    if (error) return error;
    if (validationError) return 'Invalid Ethereum address';
    if (disableStudentList) return helperText || 'Enter an Ethereum address';
    if (hasAttemptedLoad && options.length === 0 && !loading) {
      return 'No students registered yet. You can enter an Ethereum address directly.';
    }
    if (helperText !== undefined) return helperText;
    return '';
  };

  // Custom "No Options" text based on whether we've loaded data
  const getNoOptionsText = () => {
    if (loading) return 'Loading...';
    if (disableStudentList) return 'Enter an Ethereum address directly';
    if (hasAttemptedLoad && options.length === 0) {
      return 'No students registered. Enter an Ethereum address directly.';
    }
    return 'No options';
  };

  // If student list is disabled, use a simple TextField instead of Autocomplete
  if (disableStudentList) {
    return (
      <TextField
        label={label}
        value={value || ''}
        onChange={(e) => {
          const newValue = e.target.value;
          setInputValue(newValue);
          
          // Validate the address
          const isValid = isValidAddress(newValue);
          setValidationError(newValue !== '' && !isValid);
          
          // Update parent component
          onChange(newValue);
        }}
        error={!!error || validationError}
        helperText={getHelperText()}
        required={required}
        fullWidth={fullWidth}
        disabled={disabled}
        placeholder="0x..."
      />
    );
  }

  // Otherwise use the Autocomplete component for student selection
  return (
    <Autocomplete
      value={getSelectedOption()}
      onChange={(event, newValue) => {
        // If a student is selected from dropdown, use their address
        setValidationError(false); // Clear validation error when selecting from dropdown
        if (newValue) {
          // Selected from dropdown
          onChange(newValue.address);
        } else if (inputValue && isValidAddress(inputValue)) {
          // Manual entry - only update if valid
          onChange(inputValue);
        } else {
          // Cleared
          onChange('');
        }
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
          
        // Validate the address if it doesn't match any student
        if (!options.some(option => option.label === newInputValue)) {
          const isValid = isValidAddress(newInputValue);
          setValidationError(newInputValue !== '' && !isValid);
          
          // Update the value if it's valid or empty
          if (isValid) {
            onChange(newInputValue);
          }
        }
      }}
      options={options}
      getOptionLabel={(option) => {
        // For displaying in the input when selected
        if (typeof option === 'string') return option;
        return option.label ? `${option.label} (${option.address.substring(0, 6)}...${option.address.substring(38)})` : '';
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box>
            <Typography variant="body1">{option.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.address.substring(0, 10)}...{option.address.substring(option.address.length - 8)}
            </Typography>
          </Box>
        </Box>
      )}
      noOptionsText={getNoOptionsText()}
      ListboxComponent={(props) => (
        <Paper {...props}>
          {props.children || (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography color="text.secondary">
                  {getNoOptionsText()}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      loading={loading}
      fullWidth={fullWidth}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={!!error || validationError}
          helperText={getHelperText()}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};

export default StudentAddressSelector; 