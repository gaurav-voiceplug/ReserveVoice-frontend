import React from 'react';

type AuthCardProps = {
    children: React.ReactNode;
};

const AuthCard: React.FC<AuthCardProps> = ({ children }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className='flex items-center gap-2 mb-8'>
            <img src="/VoicePlug_Logo.svg" alt="Voiceplug Logo" />
            <img src="/VoiceplugText.svg" alt="Voiceplug Logo Text" />
        </div>
        <div className="relative p-1.5 w-[400px] rounded-xl bg-gradient-to-r from-blue-900 via-blue-500 to-blue-200 animate-gradient-border
            shadow-[0px_8px_17px_0px_#143CE61A,0px_30px_30px_0px_#143CE617,0px_68px_41px_0px_#143CE60D,0px_120px_48px_0px_#143CE603,0px_188px_53px_0px_#143CE600]">
            {children}
        </div>
    </div>
);

export default AuthCard;