const styles = {
  main: {
    backgroundColor: "#ffffff",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "560px",
    fontSize: "18px",
    lineHeight: "1.4",
    color: "#000",
  },
  bold: {
    fontWeight: "700",
  },

  heading: {
    fontSize: "24px",
    letterSpacing: "-0.5px",
    lineHeight: "1.3",
    fontWeight: "400",
    color: "#000",
    // textAlign: "center" as const,
    padding: "17px 0 0",
  },
  buttonContainer: {
    padding: "27px 0 27px",
  },
  button: {
    backgroundColor: "#000",
    borderRadius: "3px",
    fontWeight: "600",
    color: "#fff",
    fontSize: "15px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "11px 23px",
  },
  sectionCentered: {
    display: "block",
    // margin: "0 auto",
  },
  footerLink: {
    fontSize: "14px",
    color: "#000",
    padding: "27px 0 27px",
    // display: "block",
    textDecoration: "underline",
    textAlign: "center" as const,
  },
  hr: {
    borderColor: "#dfe1e4",
    margin: "42px 0 26px",
  },
  code: {
    fontFamily: "monospace",
    fontWeight: "700",
    padding: "1px 4px",
    backgroundColor: "#dfe1e4",
    letterSpacing: "-0.3px",
    fontSize: "21px",
    borderRadius: "4px",
    color: "#000",
  },
  logoUrl:
    "https://njjzjrcjvbtrowkmnewc.supabase.co/storage/v1/object/public/media/logo-secondary.png",
  logoImage: {
    display: "block",
    margin: "0 auto",
    width: "128px",
    height: "45px",
  },
};

export default styles;
