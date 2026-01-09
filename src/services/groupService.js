const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const TABLE_GROUPS = 'groups';
const TABLE_MEMBERS = 'group_members';
const TABLE_USERS = 'users';

// Helper: Generate 6-char random code (Uppercase AlphaNumeric)
function generateGroupCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

exports.createGroup = async (userId, groupName) => {
    let code = generateGroupCode();
    let isUnique = false;

    // Ensure code uniqueness (simple retry logic)
    while (!isUnique) {
        const { data } = await supabase.from(TABLE_GROUPS).select('id').eq('code', code).single();
        if (!data) isUnique = true;
        else code = generateGroupCode();
    }

    // 1. Create Group
    const { data: group, error: groupError } = await supabase
        .from(TABLE_GROUPS)
        .insert([
            { name: groupName, code: code, admin_id: userId }
        ])
        .select()
        .single();

    if (groupError) throw new Error(groupError.message);

    // 2. Add Admin as Member
    const { error: memberError } = await supabase
        .from(TABLE_MEMBERS)
        .insert([
            { group_id: group.id, user_id: userId }
        ]);

    if (memberError) throw new Error(memberError.message);

    // 3. Update User's current_group_id
    await supabase.from(TABLE_USERS).update({ current_group_id: group.id }).eq('id', userId);

    return group;
};

exports.joinGroup = async (userId, groupCode) => {
    // 1. Find Group
    const { data: group, error: findError } = await supabase
        .from(TABLE_GROUPS)
        .select('id, name')
        .eq('code', groupCode.toUpperCase())
        .single();

    if (findError || !group) throw new Error('Invalid Group Code');

    // 2. Check if already member
    const { data: existing } = await supabase
        .from(TABLE_MEMBERS)
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .single();

    if (existing) throw new Error('You are already in this group');

    // 3. Add Member
    const { error: joinError } = await supabase
        .from(TABLE_MEMBERS)
        .insert([
            { group_id: group.id, user_id: userId }
        ]);

    if (joinError) throw new Error(joinError.message);

    // 4. Update User's current_group_id
    await supabase.from(TABLE_USERS).update({ current_group_id: group.id }).eq('id', userId);

    return group;
};

exports.getUserGroup = async (userId) => {
    // Get user's current group ID
    const { data: user } = await supabase
        .from(TABLE_USERS)
        .select('current_group_id')
        .eq('id', userId)
        .single();

    if (!user || !user.current_group_id) return null;

    // Get Group Details
    const { data: group } = await supabase
        .from(TABLE_GROUPS)
        .select('*')
        .eq('id', user.current_group_id)
        .single();

    // Get Members
    const { data: members } = await supabase
        .from(TABLE_MEMBERS)
        .select('user_id, users(name, profilePicturePath)') // Join with users table
        .eq('group_id', group.id);

    return { ...group, members: members.map(m => m.users) };
};
