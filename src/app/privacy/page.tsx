import React from 'react'
import { Separator } from '@/components/ui/separator'

export default function PrivacyPolicyPage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8'>
      <h1 className='text-3xl font-bold mb-6'>Privacy Policy</h1>

      <div className='prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none'>
        <p>
          This privacy policy applies to the ShiftTrack web application (hereby
          referred to as &quot;Application&quot;) accessible via web browsers,
          that was created by Justin Daludado (hereby referred to as
          &quot;Service Provider&quot;) as a service. This service is intended
          for use &quot;AS IS&quot;.
        </p>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>
          Information Collection and Use
        </h2>
        <p>
          The Application collects information when you access and use it. This
          information may include:
        </p>
        <ul className='list-disc list-inside space-y-1'>
          <li>
            <strong>User Provided Information:</strong> Information you provide
            when registering or using the service, such as your name, email
            address, role (e.g., employee, manager), availability details, and
            any notes or information entered into shifts.
          </li>
          <li>
            <strong>Automatically Collected Information:</strong> Information
            collected automatically when you use the service, such as your
            device&apos;s Internet Protocol (IP) address, browser type and
            version, operating system, the pages of the Application that you
            visit, the time and date of your visit, the time spent on those
            pages, and general usage patterns.
          </li>
        </ul>

        <p className='mt-4'>
          The Application does not gather precise real-time information about
          the location of your device.
        </p>

        <p className='mt-4'>
          The Service Provider may use the information collected to provide and
          improve the Application, personalize your experience, and communicate
          with you, which may include important information, required notices,
          and marketing promotions (where permitted and with options to
          opt-out).
        </p>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>Third Party Access</h2>
        <p>
          Only aggregated, anonymized data may be periodically transmitted to
          external services (like analytics providers) to aid the Service
          Provider in improving the Application and their service. The Service
          Provider uses third-party services, such as Supabase for database
          hosting and authentication, which process your data on our behalf
          according to their own privacy policies.
        </p>
        <p className='mt-4'>
          The Service Provider may disclose User Provided and Automatically
          Collected Information:
        </p>
        <ul className='list-disc list-inside space-y-1'>
          <li>
            As required by law, such as to comply with a subpoena, or similar
            legal process;
          </li>
          <li>
            When they believe in good faith that disclosure is necessary to
            protect their rights, protect your safety or the safety of others,
            investigate fraud, or respond to a government request;
          </li>
          <li>
            With their trusted services providers (like Supabase) who work on
            their behalf, do not have an independent use of the information
            disclosed to them, and have agreed to adhere to rules consistent
            with this privacy statement.
          </li>
        </ul>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>Opt-Out Rights</h2>
        <p>
          You can stop all collection of information by the Application by
          ceasing to use the service. You can request the deletion of your
          account and associated User Provided Data by contacting the Service
          Provider at help@shifttrack.tech.
        </p>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>
          Data Retention Policy
        </h2>
        <p>
          The Service Provider will retain User Provided data for as long as you
          use the Application and for a reasonable time thereafter, as necessary
          to comply with legal obligations, resolve disputes, and enforce
          agreements. If you&apos;d like them to delete User Provided Data that
          you have provided via the Application, please contact them at
          help@shifttrack.tech and they will respond in a reasonable time.
        </p>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>Children</h2>
        <p>
          The Service Provider does not use the Application to knowingly solicit
          data from or market to children under the age of 13. The Service
          Provider does not knowingly collect personally identifiable
          information from children. The Service Provider encourages all
          children to never submit any personally identifiable information
          through the Application and/or Services. The Service Provider
          encourage parents and legal guardians to monitor their children&apos;s
          Internet usage and to help enforce this Policy by instructing their
          children never to provide personally identifiable information through
          the Application and/or Services without their permission. If you have
          reason to believe that a child has provided personally identifiable
          information to the Service Provider through the Application and/or
          Services, please contact the Service Provider (help@shifttrack.tech)
          so that they will be able to take the necessary actions. You must also
          be at least 16 years of age (or the age of consent in your
          jurisdiction) to consent to the processing of your personally
          identifiable information.
        </p>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>Security</h2>
        <p>
          The Service Provider is concerned about safeguarding the
          confidentiality of your information and provides physical, electronic,
          and procedural safeguards to protect information processed and
          maintained. However, please be aware that no security measures are
          perfect or impenetrable.
        </p>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>Changes</h2>
        <p>
          This Privacy Policy may be updated from time to time for any reason.
          The Service Provider will notify you of any changes to the Privacy
          Policy by updating this page with the new Privacy Policy. You are
          advised to consult this Privacy Policy regularly for any changes, as
          continued use is deemed approval of all changes.
        </p>

        <p className='mt-6'>
          This privacy policy is effective as of 2025-05-05{' '}
        </p>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>Your Consent</h2>
        <p>
          By using the Application, you are consenting to the processing of your
          information as set forth in this Privacy Policy now and as amended by
          us.
        </p>

        <h2 className='text-2xl font-semibold mt-6 mb-3'>Contact Us</h2>
        <p>
          If you have any questions regarding privacy while using the
          Application, or have questions about the practices, please contact the
          Service Provider via email at help@shifttrack.tech.
        </p>

        <Separator className='my-8' />
      </div>
    </div>
  )
}
