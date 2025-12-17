import { Link, Section, Text, Hr, Img } from "@react-email/components";
import { env } from "@/create-env";
import styles from "./styles";

export function Footer() {
  return (
    <>
      <Hr style={styles.hr} />
      <Section
        style={{ textAlign: "center", margin: "0 auto", padding: "20px 0" }}
      >
        <Img
          style={{
            ...styles.logoImage,
            width: "45px",
            height: "45px",
            display: "block",
            margin: "0 auto 24px auto",
            border: "none",
            maxWidth: "45px",
          }}
          src={styles.logoUrl}
          width="45"
          height="45"
          alt="Complere"
        />
        <Text
          style={{
            textAlign: "center",
            fontSize: "16px",
            color: "#666",
            margin: "0",
            lineHeight: "1.4",
            padding: "0 20px",
          }}
        >
          Copyright{` `}
          {new Date().getFullYear()}{" "}
          <Link
            href={env.NEXT_PUBLIC_DEPLOYMENT_URL}
            style={{
              color: "#000",
              textDecoration: "underline",
              fontSize: "16px",
            }}
          >
            Complere, LLC
          </Link>
          . All rights reserved.
        </Text>
      </Section>
    </>
  );
}
