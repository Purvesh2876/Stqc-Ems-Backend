import Department from '../models/departmentModel.js';

export const createDepartment = async (req, res) => {
    try {
        const { deptName, deptHead } = req.body;
        const newDepartment = new Department({
            deptName,
            deptHead,
            createdAt: new Date()
        });
        await newDepartment.save();
        res.status(201).json({ message: 'Department created successfully', data: newDepartment });
    } catch (error) {
        res.status(500).json({ message: 'Error creating department', error: error.message });
    }
}

export const getDepartment = async (req, res) => {
    try {
        const departments = await Department.find()
            .populate('pendingRequests'); // fetch request details
        res.status(200).json({ data: departments });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching departments', error: error.message });
    }
}