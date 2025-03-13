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
  fullWidth = true 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Fetch all students when the component mounts
  useEffect(() => {
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
    if (!value) return null;
    return options.find(option => option.address.toLowerCase() === value.toLowerCase()) || null;
  };

  // Validate the address when manually input
  const isValidAddress = (address) => {
    return address === '' || ethers.isAddress(address);
  };

  // When value changes externally, update validation status
  useEffect(() => {
    // Only validate if it's not a selected student (manual entry)
    if (value && !getSelectedOption()) {
      setValidationError(!isValidAddress(value));
    } else {
      setValidationError(false);
    }
  }, [value, options]);

  // Determine which helper text to show
  const getHelperText = () => {
    if (error) return error;
    if (validationError) return 'Invalid Ethereum address';
    if (hasAttemptedLoad && options.length === 0 && !loading) {
      return 'No students registered yet. You can enter an Ethereum address directly.';
    }
    if (helperText !== undefined) return helperText;
    return '';
  };

  // Custom "No Options" text based on whether we've loaded data
  const getNoOptionsText = () => {
    if (loading) return 'Loading...';
    if (hasAttemptedLoad && options.length === 0) {
      return 'No students registered. Enter an Ethereum address directly.';
    }
    return 'No options';
  };

  return (
    <Autocomplete
      value={getSelectedOption()}
      onChange={(event, newValue) => {
        // If a student is selected from dropdown, use their address
        setValidationError(false); // Clear validation error when selecting from dropdown
        if (newValue) {
          // Selected from dropdown
          onChange(newValue.address);
        } else if (inputValue) {
          // Manual entry
          const isValid = isValidAddress(inputValue);
          setValidationError(!isValid);
          if (isValid) {
            onChange(inputValue);
          }
        } else {
          // Cleared
          onChange('');
        }
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
        
        // Only validate addresses that don't match any student names
        if (!options.some(option => option.label === newInputValue)) {
          const isValid = isValidAddress(newInputValue);
          setValidationError(newInputValue !== '' && !isValid);
          
          // Only update the value if it's valid or empty
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
          onClick={() => {
            // This ensures the dropdown opens on click, even if empty
            params.inputProps.onClick && params.inputProps.onClick();
          }}
        />
      )}
    />
  );
};

export default StudentAddressSelector; 