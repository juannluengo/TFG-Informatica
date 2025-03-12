// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StudentDirectory
 * @dev Smart contract for managing a directory of students with their personal information
 *      and Ethereum addresses to make the system more user-friendly.
 */
contract StudentDirectory is AccessControl {
    // Role definition for administrators (university staff)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Structure to store student information
    struct Student {
        string name;           // First name of the student
        string surname;        // First surname of the student
        string secondSurname;  // Optional second surname of the student (can be empty)
        string studies;        // Field of study or degree program
        bool active;           // Whether the student record is active or not
    }

    // Mapping from Ethereum address to student information
    mapping(address => Student) private students;
    
    // Array to keep track of all registered student addresses for enumeration
    address[] private studentAddresses;

    // Events to log student registration and updates
    event StudentRegistered(
        address indexed studentAddress,
        string name,
        string surname,
        string secondSurname,
        string studies,
        uint256 timestamp
    );

    event StudentUpdated(
        address indexed studentAddress,
        string name,
        string surname,
        string secondSurname,
        string studies,
        uint256 timestamp
    );

    event StudentDeactivated(
        address indexed studentAddress,
        uint256 timestamp
    );

    event StudentReactivated(
        address indexed studentAddress,
        uint256 timestamp
    );

    /**
     * @dev Constructor.
     *      Sets the deployer as the default admin and grants them the ADMIN_ROLE.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Adds a new administrator.
     * @param newAdmin The address to be granted admin rights.
     * Requirements:
     * - Only accounts with the DEFAULT_ADMIN_ROLE can add new admins.
     * - `newAdmin` cannot be the zero address.
     */
    function addAdmin(address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAdmin != address(0), "Invalid address");
        _grantRole(ADMIN_ROLE, newAdmin);
    }

    /**
     * @dev Registers a new student in the directory.
     * @param studentAddress The Ethereum address of the student.
     * @param name The first name of the student.
     * @param surname The first surname of the student.
     * @param secondSurname The optional second surname of the student (can be empty).
     * @param studies The field of study or degree program.
     * Requirements:
     * - Caller must have ADMIN_ROLE.
     * - `studentAddress` must not be the zero address.
     * - Student must not already be registered.
     */
    function registerStudent(
        address studentAddress,
        string memory name,
        string memory surname,
        string memory secondSurname,
        string memory studies
    ) external onlyRole(ADMIN_ROLE) {
        require(studentAddress != address(0), "Invalid student address");
        require(bytes(students[studentAddress].name).length == 0, "Student already registered");

        Student memory student = Student({
            name: name,
            surname: surname,
            secondSurname: secondSurname,
            studies: studies,
            active: true
        });

        students[studentAddress] = student;
        studentAddresses.push(studentAddress);

        emit StudentRegistered(
            studentAddress,
            name,
            surname,
            secondSurname,
            studies,
            block.timestamp
        );
    }

    /**
     * @dev Updates an existing student's information.
     * @param studentAddress The Ethereum address of the student.
     * @param name The updated first name of the student.
     * @param surname The updated first surname of the student.
     * @param secondSurname The updated optional second surname of the student.
     * @param studies The updated field of study or degree program.
     * Requirements:
     * - Caller must have ADMIN_ROLE.
     * - Student must be registered.
     */
    function updateStudent(
        address studentAddress,
        string memory name,
        string memory surname,
        string memory secondSurname,
        string memory studies
    ) external onlyRole(ADMIN_ROLE) {
        require(bytes(students[studentAddress].name).length > 0, "Student not registered");

        Student storage student = students[studentAddress];
        student.name = name;
        student.surname = surname;
        student.secondSurname = secondSurname;
        student.studies = studies;

        emit StudentUpdated(
            studentAddress,
            name,
            surname,
            secondSurname,
            studies,
            block.timestamp
        );
    }

    /**
     * @dev Deactivates a student record.
     * @param studentAddress The Ethereum address of the student.
     * Requirements:
     * - Caller must have ADMIN_ROLE.
     * - Student must be registered and active.
     */
    function deactivateStudent(address studentAddress) external onlyRole(ADMIN_ROLE) {
        require(bytes(students[studentAddress].name).length > 0, "Student not registered");
        require(students[studentAddress].active, "Student already deactivated");

        students[studentAddress].active = false;
        emit StudentDeactivated(studentAddress, block.timestamp);
    }

    /**
     * @dev Reactivates a deactivated student record.
     * @param studentAddress The Ethereum address of the student.
     * Requirements:
     * - Caller must have ADMIN_ROLE.
     * - Student must be registered and inactive.
     */
    function reactivateStudent(address studentAddress) external onlyRole(ADMIN_ROLE) {
        require(bytes(students[studentAddress].name).length > 0, "Student not registered");
        require(!students[studentAddress].active, "Student already active");

        students[studentAddress].active = true;
        emit StudentReactivated(studentAddress, block.timestamp);
    }

    /**
     * @dev Gets information about a specific student.
     * @param studentAddress The Ethereum address of the student.
     * @return The Student struct containing the student's information.
     * Requirements:
     * - Student must be registered.
     */
    function getStudent(address studentAddress) external view returns (Student memory) {
        require(bytes(students[studentAddress].name).length > 0, "Student not registered");
        return students[studentAddress];
    }

    /**
     * @dev Checks if a student is registered.
     * @param studentAddress The Ethereum address of the student.
     * @return True if the student is registered, false otherwise.
     */
    function isStudentRegistered(address studentAddress) external view returns (bool) {
        return bytes(students[studentAddress].name).length > 0;
    }

    /**
     * @dev Gets the total number of registered students.
     * @return The count of registered students.
     */
    function getStudentCount() external view returns (uint256) {
        return studentAddresses.length;
    }

    /**
     * @dev Gets a student address by index for enumeration.
     * @param index The index in the studentAddresses array.
     * @return The student's Ethereum address.
     * Requirements:
     * - Index must be within bounds.
     */
    function getStudentAddressByIndex(uint256 index) external view returns (address) {
        require(index < studentAddresses.length, "Index out of bounds");
        return studentAddresses[index];
    }

    /**
     * @dev Gets a batch of student addresses for pagination.
     * @param startIndex The starting index in the studentAddresses array.
     * @param count The number of addresses to retrieve.
     * @return An array of student addresses.
     */
    function getStudentAddressesBatch(uint256 startIndex, uint256 count) external view returns (address[] memory) {
        require(startIndex < studentAddresses.length, "Start index out of bounds");
        
        // Adjust count if it would exceed array bounds
        if (startIndex + count > studentAddresses.length) {
            count = studentAddresses.length - startIndex;
        }
        
        address[] memory batch = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            batch[i] = studentAddresses[startIndex + i];
        }
        
        return batch;
    }
} 