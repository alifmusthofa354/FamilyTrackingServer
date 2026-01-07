const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const TABLE_NAME = 'users';

// Get User Profile by ID
exports.getUserById = async (id) => {
    const { data: user, error } = await supabase
        .from(TABLE_NAME)
        .select('id, name, email, created_at') // Don't return password
        .eq('id', id)
        .single();

    if (error) {
        throw new Error('User not found');
    }
    return user;
};

// Update User Profile
exports.updateUser = async (id, updateData) => {
    const { name, email, password } = updateData;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    // Hash password if updated
    if (password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select('id, name, email, created_at') // Return updated data without password
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

// Delete User Account
exports.deleteUser = async (id) => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
    return true;
};
// Upload Profile Picture
exports.uploadProfilePicture = async (userId, file) => {
    // 0. Check for existing profile picture to delete
    console.log("nana")
    try {
        const { data: user } = await supabase
            .from(TABLE_NAME)
            .select('profilePicturePath')
            .eq('id', userId)
            .single();

        if (user && user.profilePicturePath) {
            // Extract filename from URL
            // URL format: .../photoprofile/filename.png
            const oldUrl = user.profilePicturePath;
            const urlParts = oldUrl.split('/');
            const oldFileName = urlParts[urlParts.length - 1];

            console.log('DEBUG DELETE - Old URL:', oldUrl);
            console.log('DEBUG DELETE - Extracted Filename:', oldFileName);

            if (oldFileName) {
                const { error: deleteError } = await supabase
                    .storage
                    .from('photoprofile')
                    .remove([oldFileName]);

                if (deleteError) {
                    console.error('DEBUG DELETE - Supabase Error:', deleteError);
                } else {
                    console.log(`DEBUG DELETE - Success deleting: ${oldFileName}`);
                }
            }
        }
    } catch (err) {
        console.error('Error deleting old image:', err.message);
        // Continue upload even if delete fails
    }

    // 1. Upload to Supabase Storage
    const fileName = `avatar_${userId}_${Date.now()}.png`; // Create unique filename

    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('photoprofile')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('photoprofile')
        .getPublicUrl(fileName);

    // 3. Update User Table with path/url
    // Assuming column name is 'profilePicturePath'
    const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({ profilePicturePath: publicUrl })
        .eq('id', userId);

    if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
    }

    return publicUrl;
};
