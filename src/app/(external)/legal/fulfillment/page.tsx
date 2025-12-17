import React from "react";
import LegalPage from "../components/legal-page";

const TermsOfService: React.FC = () => {
  return (
    <LegalPage
      title="
        Fulfillment, Payment, and Refund Policy"
    >
      <div>
        <p className="mb-4">
          Complēre is a platform that allows funders to research and evaluate
          potential projects.
        </p>
        <h2 className="mb-4 mt-6 text-2xl font-bold">
          1. Fulfillment of Projects
        </h2>
        <p className="mb-4">
          When you create a project in Complēre, you are responsible for
          ensuring that your materials and project information is accurate.
          Complēre does not proofread or otherwise evaluate your materials. You
          are able to build a project and preview our system without payment.
          Once you are confident your project is ready to present, you will be
          asked to submit payment.
        </p>
      </div>
    </LegalPage>
  );
};

export default TermsOfService;
