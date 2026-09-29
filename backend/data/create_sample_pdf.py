import os
from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.set_text_color(30, 41, 59)
        self.cell(0, 10, 'ApexCloud Enterprise SLA & Support Policy', border=False, align='C', new_x="LMARGIN", new_y="NEXT")
        self.set_font('helvetica', 'I', 9)
        self.set_text_color(100, 116, 139)
        self.cell(0, 5, 'Document Ref: SLA-ENT-2026 | Classification: Customer Facing', border=False, align='C', new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f'Page {self.page_no()}', border=False, align='C')

def create_sample_sla_pdf(output_path):
    pdf = PDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Section 1
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, '1. Service Level Agreement (SLA) Commitments', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, 
        'ApexCloud guarantees a 99.99% monthly Service Availability uptime percentage for all Enterprise and Business tier customers. '
        'Availability is calculated on a calendar month basis excluding scheduled maintenance windows announced at least 72 hours in advance. '
        'If ApexCloud fails to meet the guaranteed 99.99% uptime target, eligible customers receive Service Level Credits: '
        '- 99.90% to 99.98% uptime: 10% credit applied to next monthly invoice. '
        '- 99.00% to 99.89% uptime: 25% credit applied to next monthly invoice. '
        '- Below 99.00% uptime: 50% credit applied to next monthly invoice. '
        'Credit requests must be submitted within thirty (30) days of the affected calendar month.'
    )
    pdf.ln(4)

    # Section 2
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, '2. Incident Severity Levels & Response Times', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6,
        'ApexCloud categorizes support requests into four severity tiers:\n'
        '* Severity 1 (Critical Outage): Catastrophic event causing complete disruption of core platform services for all or majority of users. '
        'Guaranteed Initial Response Time: 15 minutes. 24x7 continuous engineering escalation until resolution.\n'
        '* Severity 2 (Major Impairment): Severe degradation of critical functionality with no viable workaround. '
        'Guaranteed Initial Response Time: 1 hour. Active escalation during business hours.\n'
        '* Severity 3 (Minor Issue): Non-critical feature failure or system impairment with an available workaround. '
        'Guaranteed Initial Response Time: 4 business hours.\n'
        '* Severity 4 (General Inquiry): General configuration questions, feature requests, or documentation clarification. '
        'Guaranteed Initial Response Time: 12 business hours.'
    )
    pdf.ln(4)

    # Page 2
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, '3. Human Support Handoff & Escalation Procedure', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6,
        'When customer inquiries cannot be resolved through the AI Assistant or when automated answers do not fulfill the query, '
        'customers can seamlessly transition to a human support agent. '
        'The escalation process automatically transmits the customer name, corporate email address, full conversation transcript, '
        'and system diagnostic telemetry directly to our Tier 2 Support Engineering queue. '
        'For urgent issues, enterprise customers may also call our emergency phone hotline at +1 (800) 555-APEX available 24/7/365.'
    )
    pdf.ln(4)

    # Section 4
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, '4. Data Backup & Disaster Recovery (DR)', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6,
        'ApexCloud executes automated continuous point-in-time database backups with a Recovery Point Objective (RPO) of under 5 minutes. '
        'Full snapshot backups are replicated across multi-region availability zones daily. '
        'Our Recovery Time Objective (RTO) for full catastrophic failover is guaranteed at under 60 minutes. '
        'Disaster recovery simulations are conducted quarterly and compliance audit summaries are published to customer trust portals.'
    )
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pdf.output(output_path)
    print(f"Generated sample PDF at: {output_path}")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), 'sample_docs', 'ApexCloud_Enterprise_SLA_and_Support_Policy.pdf')
    create_sample_sla_pdf(target)
