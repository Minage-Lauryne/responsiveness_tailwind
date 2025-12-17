'use client';

import React from "react";
import { useRouter } from "next/navigation";
import LegalPage from "../components/legal-page";
import { config } from "../config";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy: React.FC = () => {
  const router = useRouter();
  return (
    <LegalPage title="Complēre Privacy Policy">
       <div className="mb-6 mt-[-9%] mr-5 flex justify-end">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <p>
        At {config.companyName}, we understand the critical importance of
        privacy and confidentiality in legal matters. This Privacy Policy
        explains how we collect, use, disclose, and safeguard your information
        and the information you provide when using our platform.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>1.1 Account Information</h3>
      <p>
        We collect the following types of information when you create an account
        and use our Services:
      </p>
      <ul>
        <li>Name and contact information</li>
        <li>Company or organization affiliation</li>
        <li>Billing information</li>
      </ul>

      <h3>1.2 Project-Related Information</h3>
      <p>
        When you create projects and conduct research with Complēre, we collect:
      </p>
      <ul>
        <li>Project details and summaries</li>
        <li>Related documents and materials</li>
      </ul>

      <h3>1.3 Usage Data</h3>
      <p>
        We automatically collect certain information about your use of our
        Services, including:
      </p>
      <ul>
        <li>Access times and dates</li>
        <li>Pages viewed and interactions with the platform</li>
        <li>Project creation and management activities</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information for the following purposes:</p>
      <ul>
        <li>To provide and maintain our Service</li>
        <li>To facilitate the creation and management of projects</li>
        <li>To analyze platform usage and improve our Service</li>
        <li>To provide technical and customer support</li>
        <li>To process payments and manage your account</li>
        <li>To comply with legal and ethical obligations</li>
        <li>To protect the security and integrity of our platform</li>
      </ul>

      <h2>3. Data Retention and Deletion</h2>
      <p>
        We retain your account information and Project data for 6 months. You
        can request deletion of your account and associated data at any time.
        However, we may retain certain information as required by law or for
        legitimate business purposes.
      </p>

      <h2>4. Your Rights and Control</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access and update your account information</li>
        <li>Request deletion of your account and associated data</li>
      </ul>

      <h2>5. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy to reflect changes in our practices or
        for other operational, legal, or regulatory reasons. We will notify you
        of any material changes via email or through a prominent notice on our
        platform.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, data protection
        practices, or your dealings with our Service, please contact us at:
      </p>
      <p>
        {config.companyName}
        <br />
        {config.address}
        <br />
        Email: {config.supportEmail}
      </p>

      <p>
        By using our Service, you acknowledge that you have read and understood
        this Privacy Policy and agree to its terms.
      </p>
    </LegalPage>
  );
};

export default PrivacyPolicy;
