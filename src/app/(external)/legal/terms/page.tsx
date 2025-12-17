import React from "react";
import LegalPage from "../components/legal-page";
import { config } from "../config";
const TermsOfService: React.FC = () => {
  return (
    <LegalPage
      title="
        Terms of Service for Users Using Complere, LLC Online Research Platform"
    >
      <div>
        <h2 className="mb-4 mt-6 text-2xl font-bold">
          1. Introduction and Acceptance of Terms
        </h2>
        <p className="mb-4">
          Welcome to the Complere, LLC ("Company", "we", "our", "us") Online
          Research Platform. As a professional using our platform to create and
          conduct research, you agree to be bound by these Terms of Service
          ("Terms"). If you do not agree to these Terms, please do not use our
          Platform.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          2. Eligibility and Account Security
        </h2>
        <p className="mb-4">
          2.1. You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          3. Project Creation and Content Responsibility
        </h2>
        <p className="mb-4">
          3.1. You are solely responsible for the content you upload, create, or
          share on the Platform.
        </p>
        <p className="mb-4">
          3.2. You agree not to include any confidential, privileged, or court
          protected information in your projects without proper authorization or
          redaction.
        </p>
        <p className="mb-4">
          3.3. You warrant that you have the necessary rights and permissions to
          use all content in your projects and that such use does not violate
          any applicable laws or regulations or court orders.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          4. Confidentiality and Data Protection
        </h2>
        <p className="mb-4">
          4.1. You are responsible for ensuring that your use of the Platform
          complies with all applicable privacy laws and regulations.
        </p>
        <p className="mb-4">
          4.2. We are not responsible for any private or court-protected
          information that you may include in the project. You agree to
          indemnify and hold us harmless from any claims arising from the
          unauthorized disclosure of such information.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          5. Data Retention and Destruction
        </h2>
        <p className="mb-4">
          5.1. The Complēre interface retains project information while users
          maintain an active paid subscription. After this period, the project
          information and all Complēre reports will be deleted from our systems
          and will not be recoverable in any form.
        </p>
        <p className="mb-4">
          5.2. You are responsible for downloading and securely storing any data
          you wish to retain beyond the service period.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          6. Ethical Considerations
        </h2>
        <p className="mb-4">
          6.1. You agree to use the Platform in a manner consistent with the
          ethical rules governing your profession.
        </p>
        <p className="mb-4">
          6.2. You will not use the Platform to engage in any unethical or
          improper practices.
        </p>
        <p className="mb-4">
          6.3. You are responsible for determining the ethical considerations,
          if any, of using our platform.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          7. Intellectual Property
        </h2>
        <p className="mb-4">
          7.1. You grant us a license to use the data created by you in Complēre
          to improve the project.
        </p>
        <p className="mb-4">
          7.2. We do not sell or distribute your data to other parties.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">8. Prohibited Conduct</h2>
        <p className="mb-4">You agree not to:</p>
        <ul className="mb-4 list-inside list-disc">
          <li>Use the Platform for any unlawful purpose.</li>

          <li>
            Interfere with the Platform's operation or other users' projects.
          </li>
          <li>
            Attempt to contact other users or participants outside of your
            organization.
          </li>

          <li>
            Attempt unauthorized access to other users' data or the Platform's
            systems.
          </li>
        </ul>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          9. Disclaimers and Limitation of Liability
        </h2>
        <p className="mb-4">
          9.1. The Platform is provided "as is" without warranties. We do not
          guarantee that the Platform will meet your specific requirements or
          expectations.
        </p>
        <p className="mb-4">
          9.2. We shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of the Platform or the
          results of your projects.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">10. Disclaimers</h2>
        <p className="mb-4">
          10.1. The projects are for research purposes only and do not
          constitute legal advice.
        </p>
        <p className="mb-4">
          10.2. We do not guarantee the accuracy or completeness of any
          information presented in the projects.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          11. Changes to Terms and Service
        </h2>
        <p className="mb-4">
          We may modify these Terms or the Service at any time. Continued use
          after changes constitutes acceptance of the new Terms.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">12. Termination</h2>
        <p className="mb-4">
          We reserve the right to terminate or suspend your account at our
          discretion, without notice, for any reason including violation of
          these Terms or applicable rules.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          13. Liability for Information Dissemination
        </h2>
        <p className="mb-4">
          13.1. You acknowledge and agree that Complere, LLC shall not be held
          liable for any dissemination of project information by you or any
          other person not within your organization.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">14. Governing Law</h2>
        <p className="mb-4">
          These Terms are governed by the laws of the State of {config.state},
          United States of America. Any disputes will be subject to the
          exclusive jurisdiction of the courts in the State of {config.state},
          United States of America.
        </p>

        <h2 className="mb-4 mt-6 text-2xl font-bold">
          15. Contact Information
        </h2>
        <p className="mb-4">
          For questions about these Terms or the use of our Platform, please
          contact us at support@complere.ai.
        </p>
      </div>
    </LegalPage>
  );
};

export default TermsOfService;
