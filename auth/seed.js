import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import User from "./models/users.models.js"; // Apne path ke hisab se check kar lena
import Role from './models/roles.models.js';
import Permission from './models/permissions.models.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDB = async () => {
    try {
        // 1. Database Connection
        await mongoose.connect(`${process.env.MONGODB_URI}/auth?authSource=admin`);
        
        console.log("Connected to DB for seeding...");

        await User.deleteMany()
        await Permission.deleteMany({});
        await Role.deleteMany({});
        console.log("Cleaning old data...");

        // 2. Create Permissions
        const resources = ['orders','logs','roles','permissions'];
        const actions = ['read', 'write', 'delete'];
        const permissionDocs = [];

        for (const res of resources) {
            for (const act of actions) {
                permissionDocs.push({ resource: res, action: act });
            }
        }
        const createdPermissions = await Permission.insertMany(permissionDocs);
        console.log(`${createdPermissions.length} Permissions created.`);

        // 3. Create Roles & Link Permissions
        const rolesData = [
            {
                name: 'admin',
                description: 'system administrator with full access',
                permissions: createdPermissions.map(p => p._id) // All permissions
            },
            {
                name: 'seller',
                description: 'can manage products and view orders',
                permissions: createdPermissions.filter(p => ['products', 'orders'].includes(p.resource)).map(p => p._id)
            },
            {
                name: 'buyer',
                description: 'can browse products and place orders',
                permissions: createdPermissions.filter(p => p.action === 'read').map(p => p._id)
            }
        ];
        const createdRoles = await Role.insertMany(rolesData);
        console.log(`${createdRoles.length} Roles created.`);

        // 4. Update/Create Test User
        const adminRole = createdRoles.find(r => r.name === 'admin');
        const buyerRole = createdRoles.find(r => r.name === 'buyer');

        // admin User logic
        const adminUserEmail = 'admin@gmail.com'; 
        let testUser = await User.findOne({ email: adminUserEmail });

        if (testUser) {
            testUser.role = [adminRole._id];
            await testUser.save();
            console.log("Updated existing test user with Admin role.");
        } else {
            await User.create({
                email: adminUserEmail,
                username:"admin",
                password: 'password123', // auto-hash ho jayega pre-save hook se
                isActive: true,
                role: [adminRole._id]
            });
            console.log("Created new admin user.");
        }

        // 5. Create Fake Users
        const fakeUsers = [];
        for (let i = 0; i < 10; i++) {
            fakeUsers.push({
                email: faker.internet.email().toLowerCase(),
                password: 'password123',
                username:faker.internet.username().toLowerCase(),
                role: [buyerRole._id] // Defaulting fake users to buyers
            });
        }
        
        
        for (const u of fakeUsers) {
            await User.create(u);
        }

        console.log("10 Fake users created successfully.");
        process.exit();

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedDB();