export interface SampleContract {
  id: string;
  title: string;
  jurisdiction: string;
  tag: string;
  content: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: "freelance-msa",
    title: "Master Services Agreement (Software)",
    jurisdiction: "US / Delaware",
    tag: "Freelance",
    content: `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into on November 18, 2026 between:
Client: Apex Meridian Technologies Inc., located at 440 Montgomery Street, Suite 1200, San Francisco, CA 94104 ("Client"), represented by Elena Rostova (elena.rostova@apexmeridian.io, +1-415-890-3421).
Contractor: Daniel Pratama, Tax ID 412-88-9041, residing at 718 Pinecrest Ave, Austin, TX 78701 (daniel.pratama@protonmail.com, +1-512-604-7782).

1. COMPENSATION & PAYMENT TERMS
Client shall pay Contractor a total fixed fee of $48,500 for the platform migration. Invoices shall be wired to Bank Account IBAN US89-3920-4810-9921-4402 within ninety (90) days after Client's sole and subjective acceptance of final deliverables. Client may withhold payment indefinitely if any minor cosmetic defect is reported.

2. INTELLECTUAL PROPERTY ASSIGNMENT
Contractor hereby irrevocably assigns to Client all worldwide right, title, and interest in all work product, software, libraries, tools, and any pre-existing code or personal frameworks owned by Contractor that are referenced or used during the engagement, without additional royalty.

3. UNLIMITED LIABILITY & INDEMNIFICATION
Contractor agrees to indemnify, defend, and hold harmless Client from any and all direct, indirect, incidental, consequential, or punitive damages arising out of or related to this Agreement, with no cap on Contractor's total financial liability.

4. TERMINATION & NON-COMPETE
Client may terminate this Agreement immediately without cause and without obligation to pay for work-in-progress. For twenty-four (24) months following termination, Contractor shall not provide software engineering services to any enterprise SaaS company worldwide.`,
  },
  {
    id: "exec-offer-nda",
    title: "Senior Engineer Offer & Confidentiality",
    jurisdiction: "Singapore / Remote",
    tag: "Employment",
    content: `EMPLOYMENT OFFER & CONFIDENTIALITY AGREEMENT

Candidate: Nadia Kusuma (Passport/ID: K88219402, email: nadia.kusuma@gmail.com, phone: +62-812-9044-1120)
Address: Jl. Kemang Raya No. 42, Jakarta Selatan 12730
Employer: Helion Cloud Labs Pte. Ltd., 8 Marina View #22-05, Singapore 018960
HR Contact: Marcus Tan (marcus.tan@helionlabs.sg)

1. SALARY & BONUS
Base salary is $132,000 per annum, paid monthly to bank account 7740-1928-4410. Performance bonus of $18,000 is entirely discretionary and forfeited if Employee resigns before March 31 of the following year.

2. INVENTIONS & SIDE PROJECTS
Employee agrees that any software, patent, or creative work conceived by Employee during employment—including work created on Employee's own time and personal equipment—shall automatically become the sole property of Helion Cloud Labs Pte. Ltd.

3. POST-EMPLOYMENT RESTRICTIONS
Employee shall not solicit any client, vendor, or employee of the Company for 18 months after departure, and agrees to a mandatory 12-month non-compete across all cloud computing and AI sectors in Southeast Asia without garden-leave compensation.`,
  },
  {
    id: "saas-vendor-sla",
    title: "Enterprise IT Vendor & SLA Agreement",
    jurisdiction: "UK / London",
    tag: "Vendor SLA",
    content: `ENTERPRISE IT VENDOR & SLA AGREEMENT

This Agreement is executed on November 20, 2026 between:
Customer: Northbridge Logistics Digital Ltd., located at 88 Bishopsgate, Floor 14, London EC2N 4BQ, represented by Oliver Bennett (oliver.bennett@northbridgelogistics.co.uk, +44-20-7946-0821).
Vendor: Reza Mahendra, Tax ID 819-44-2039, residing at 142 Harborview Road, Bristol BS1 4TR (reza.mahendra@cloudcraft.dev, +44-117-496-0218).

1. CONTRACT VALUE & PAYMENT
Total project fee is $185,000, payable to Account 5270-8812-3490 only after the entire system operates with zero incidents for sixty (60) days post-handover. No upfront deposit is provided.

2. LIQUIDATED DAMAGES & UNILATERAL TERMINATION
For every day of delivery delay, Vendor incurs a penalty of 2% of the total contract value per day with no maximum cap. Customer may terminate this Agreement unilaterally at any time without compensating Vendor for completed milestones.

3. OWNERSHIP OF INTERNAL LIBRARIES
All source code, documentation, and Vendor's pre-existing internal libraries utilized in the deployment permanently transfer to Customer as sole owner.`,
  },
];
