import { GitHubOAuthButton } from '@/components/GitHubOauthButton'
import React from 'react'

const page = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
        <GitHubOAuthButton/>
    </div>
  )
}

export default page