import streamlit as st
from utils.api import call_api
from streamlit_option_menu import option_menu
import json

if "endpoints" not in st.session_state:
    with open("endpoints.json") as f:
        st.session_state.endpoints = json.load(f)

# Page config
st.set_page_config(page_title="Insurance Portal", layout="wide")

# Session state initialization
if 'user' not in st.session_state:
    st.session_state.user = None

# Sidebar navigation
with st.sidebar:
    selected = option_menu(
        "Insurance Portal",
        ["Login", "Sign Up", "Dashboard", "Get Quotation", "Download Policy", "Submit Claim"],
        icons=["person", "person-plus", "speedometer", "currency-dollar",  "file-earmark-arrow-down", "shield-check"],
        menu_icon="house",
        default_index=0
    )

# ------------------ LOGIN ------------------
if selected == "Login":
    st.title("User Login")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password")

    if st.button("Login"):
        res = call_api("user_service", "/api/login", method="POST", data={"email": email, "password": password})
        if "error" in res:
            st.error("Login failed: " + res["error"])
        else:

            st.session_state.user = res
            st.success("Login successful!")

# ------------------ SIGN UP ------------------
elif selected == "Sign Up":
    st.title("Register New Account")
    full_name = st.text_input("Full Name")
    email = st.text_input("Email")
    phone = st.text_input("Phone Number (e.g., +91XXXXXXXXXX)")
    password = st.text_input("Password", type="password")

    if st.button("Register"):
        # Validate phone number format
        if not phone.startswith("+") or not phone[1:].isdigit():
            st.error("Please enter a valid phone number in international format (e.g., +91XXXXXXXXXX).")
        else:
            res = call_api("user_service", "/api/users/", method="POST", data={
                "full_name": full_name,
                "email": email,
                "phone_number": phone,
                "password": password
            })
            if "error" in res:
                st.error("Signup failed: " + res["error"])
            else:
                st.success("User registered successfully!")


# ------------------ DASHBOARD ------------------
elif selected == "Dashboard":
    st.title("User Dashboard")
    if not st.session_state.user:
        st.warning("Please login to view dashboard.")
    else:
        user_id = st.session_state.user["id"]

        st.subheader("Your Policies")
        policies = call_api("policy_service", f"/api/policies/")
        if isinstance(policies, list):
            user_policies = [p for p in policies if p["user_id"] == user_id]
            if user_policies:
                st.table(user_policies)
            else:
                st.info("No policies found.")
        else:
            st.error("Failed to fetch policies.")

        st.subheader("Your Claims")
        claims = call_api("claims_service", f"/api/claims/")
        if isinstance(claims, list):
            user_claims = [c for c in claims if c["user_id"] == user_id]
            if user_claims:
                st.table(user_claims)
            else:
                st.info("No claims submitted yet.")
        else:
            st.error("Failed to fetch claims.")

elif selected == "Get Quotation":
    st.title("Get Insurance Quotation")

    if not st.session_state.user:
        st.warning("Please login or sign up to generate quotations.")
    else:
        # Initialize state to store quote if not already present
        if 'latest_quote' not in st.session_state:
            st.session_state.latest_quote = None

        insurance_type = st.selectbox("Insurance Type", ["travel", "health"])
        destination = st.text_input("Destination (if applicable)")
        start_date = st.date_input("Start Date")
        end_date = st.date_input("End Date")
        age = st.number_input("Age", min_value=1, step=1)
        conditions = st.text_input("Pre-existing Conditions")
        coverage = st.number_input("Coverage Amount", step=1000)

        if st.button("Generate Quote"):
            data = {
                "user_id": str(st.session_state.user["id"]),
                "insurance_type": insurance_type,
                "destination": destination,
                "start_date": str(start_date),
                "end_date": str(end_date),
                "age": age,
                "pre_existing_conditions": conditions,
                "coverage_amount": coverage
            }

            res = call_api("quotation_service", "/quotes", method="POST", data=data)
            if "error" in res:
                st.error("Error: " + res["error"])
                st.session_state.latest_quote = None
            else:
                st.success(f"Quote generated: ₹{res['calculated_premium']}")
                st.session_state.latest_quote = {
                    "premium": res["calculated_premium"],
                    "insurance_type": insurance_type,
                    "start_date": str(start_date),
                    "end_date": str(end_date),
                    "coverage": coverage
                }
                

        # Purchase flow (if quote exists)
        if st.session_state.latest_quote:
            st.markdown("---")
            st.subheader("Proceed to Purchase")

            if st.button("Purchase This Policy"):
                q = st.session_state.latest_quote
                policy_data = {
                    "user_id": st.session_state.user["id"],
                    "policy_type": q["insurance_type"],
                    "start_date": q["start_date"],
                    "end_date": q["end_date"],
                    "coverage_amount": q["coverage"],
                    "premium": q["premium"]
                }

                policy_res = call_api("policy_service", "/api/policies/", method="POST", data=policy_data)

                if "error" in policy_res:
                    st.error("Policy creation failed: " + policy_res["error"])
                else:
                    st.success("Policy created successfully!")
                    st.json(policy_res)

                    policy_id = policy_res.get("id")

                    # Step 1: Generate document
                    doc_payload = {
                        "policy_id": policy_id,
                        "document_type": "string"
                    }
                    doc_res = call_api("documentation_service", "/api/documents", method="POST", data=doc_payload)

                    if "error" in doc_res or "id" not in doc_res:
                        st.warning("Policy document creation failed.")
                        document_id = "N/A"
                    else:
                        st.success("Policy document generated!")
                        document_id = doc_res["id"]
                        st.write("Document ID:", document_id)

                    # Step 2: Send confirmation email with document info
                    email_payload = {
                        "to": st.session_state.user["email"],
                        "subject": "Your Insurance Policy Details",
                        "body": f"""
            Hi {st.session_state.user["full_name"]},

            Thank you for purchasing the {q['insurance_type']} insurance policy.

            Here are your policy details:
            - Policy ID: {policy_id}
            - Coverage Amount: ₹{q['coverage']}
            - Premium: ₹{q['premium']}
            - Start Date: {q['start_date']}
            - End Date: {q['end_date']}
            - Document ID: {document_id}

            Stay safe!
            Insurance Portal Team
            """
                    }
                    
                    email_res = call_api("email_service", "/send-quote-email", method="POST", data=email_payload)
                    
                    st.write(email_res)
                    # Check if the request succeeded (avoid false negatives)
                    if isinstance(email_res, dict) and email_res.get("error"):
                        st.warning("Policy created, but failed to send confirmation email.")
                    else:
                        st.success("Confirmation email sent successfully!")

                    # Step 3: Send SMS confirmation
                    sms_payload = {
                        "phone_number": st.session_state.user["phone_number"],
                        "message": f"""
                    {q['insurance_type'].capitalize()} policy confirmed! ID: {policy_id}, Coverage: ₹{q['coverage']}, Premium: ₹{q['premium']}
                    """
                    }

                    sms_res = call_api("sms_service", "/send-quote-sms", method="POST", data=sms_payload)
                    st.write(sms_res)
                    st.write(st.session_state.user["phone_number"])
                    # Display SMS status
                    if isinstance(sms_res, dict) and sms_res.get("error"):
                        st.warning("Policy created, but failed to send confirmation SMS.")
                    else:
                        st.success("Confirmation SMS sent successfully!")



# ------------------ DOWNLOAD POLICY ------------------
elif selected == "Download Policy":
    st.title("Download Policy Document")
    if not st.session_state.user:
        st.warning("Please login first.")
    else:
        
        
        policy_id = st.text_input("Enter Document ID")

        if st.button("Download Document"):
            res = call_api("documentation_service", f"/api/documents/{policy_id}")
            
            if "error" in res or "document_url" not in res:
                st.error("Document not found.")
            else:
                # Replace internal Docker hostname with bore.pub host and port
                base_url = st.session_state.endpoints["documentation_service"]
                public_host = base_url.replace("http://", "").split(":")[0]
                public_port = base_url.split(":")[-1]
                fixed_url = res["document_url"].replace("host.docker.internal:8004", f"{public_host}:{public_port}")
                st.markdown(f"[Click to download PDF]({fixed_url})", unsafe_allow_html=True)



# ------------------ SUBMIT CLAIM ------------------
elif selected == "Submit Claim":
    st.title("Submit Insurance Claim")

    if not st.session_state.user:
        st.warning("Please login first.")
    else:
        user_id = st.session_state.user["id"]

        # Fetch user's policies from policy_service
        all_policies = call_api("policy_service", "/api/policies")
        if isinstance(all_policies, list):
            user_policies = [p for p in all_policies if p["user_id"] == user_id]

            if not user_policies:
                st.info("You don't have any active policies.")
            else:
                # Let them choose one of their own policy IDs
                policy_options = {f"{p['id']} - {p['policy_type']} (₹{p['coverage_amount']})": p for p in user_policies}
                selected_label = st.selectbox("Select Policy", list(policy_options.keys()))
                selected_policy = policy_options[selected_label]

                claim_amount = st.number_input("Claim Amount", step=1000)
                claim_date = st.date_input("Incident Date")
                incident_details = st.text_area("Incident Description")

                if st.button("Submit Claim"):
                    if claim_amount > selected_policy["coverage_amount"]:
                        st.error("Claim amount exceeds coverage. Please enter a valid amount.")
                    elif not (selected_policy["start_date"] <= str(claim_date) <= selected_policy["end_date"]):
                        st.error("Claim date is outside the policy validity period.")
                    else:
                        data = {
                            "policy_id": selected_policy["id"],
                            "user_id": user_id,
                            "claim_amount": claim_amount,
                            "claim_date": str(claim_date),
                            "incident_details": incident_details
                        }

                        res = call_api("claims_service", "/api/claims/", method="POST", data=data)
                        if "error" in res:
                            st.error("Submission failed: Please check your claim details or policy coverage.")
                        else:
                            st.success("Claim submitted successfully!")

                            # 📩 Minimal Email Confirmation
                            email_payload = {
                                "to": st.session_state.user["email"],
                                "subject": "Insurance Claim Submitted",
                                "body": f"Hi {st.session_state.user['full_name']}, your claim for Policy ID {selected_policy['id']} of ₹{claim_amount} has been submitted."
                            }

                            email_res = call_api("email_service", "/send-quote-email", method="POST", data=email_payload)
                            
                            # 📱 Minimal SMS Confirmation
                            sms_payload = {
                                "phone_number": st.session_state.user["phone_number"],
                                "message": f"Claim submitted for Policy ID: {selected_policy['id']}, ₹{claim_amount}."
                            }

                            sms_res = call_api("sms_service", "/send-quote-sms", method="POST", data=sms_payload)

                            # ✅ Display confirmation status
                            if isinstance(email_res, dict) and email_res.get("error"):
                                st.warning("Claim submitted, but failed to send confirmation email.")
                            else:
                                st.success("Confirmation email sent successfully!")

                            if isinstance(sms_res, dict) and sms_res.get("error"):
                                st.warning("Claim submitted, but failed to send confirmation SMS.")
                            else:
                                st.success("Confirmation SMS sent successfully!")

        else:
            st.error("Unable to fetch your policies. Please try again later.")


