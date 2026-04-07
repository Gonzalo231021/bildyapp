import bcryptjs from 'bcryptjs';

export const encrypt = async (password) => {
    const hash = await bcryptjs.hash(password, 10);
    return hash;
};

export const compare = async (password, hashedPassword) => {
    return bcryptjs.compare(password, hashedPassword);
};