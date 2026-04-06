<?php

namespace Database\Seeders;

use App\Models\CourseTemplate;
use Illuminate\Database\Seeder;

class CourseTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            // ── General / Onboarding ──
            [
                'name'        => 'Employee Onboarding',
                'description' => 'Welcome new hires with company overview, policies, and first-day essentials.',
                'category'    => 'Onboarding',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'Getting Started',
                            'description' => 'Welcome and orientation basics',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Welcome to the Team', 'content' => '<h2>Welcome!</h2><p>We\'re excited to have you on board. This course will walk you through everything you need to know to get started.</p>'],
                                ['type' => 'video', 'title' => 'Welcome Message from Leadership', 'content' => ''],
                                ['type' => 'document', 'title' => 'Employee Handbook', 'content' => ''],
                            ],
                        ],
                        [
                            'title'       => 'About the Company',
                            'description' => 'Our mission, values, and culture',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Who We Are & What We Do', 'content' => '<p>Learn about our company history, mission, and what makes us unique.</p>'],
                                ['type' => 'text', 'title' => 'Our Mission', 'content' => '<p>Our mission statement and core purpose.</p>'],
                                ['type' => 'text', 'title' => 'Our Company Values', 'content' => '<p>The values that guide everything we do.</p>'],
                                ['type' => 'link', 'title' => 'Visit Our Online Assets', 'content' => ''],
                            ],
                        ],
                        [
                            'title'       => 'Rules & Protocols',
                            'description' => 'Company policies and procedures',
                            'objects'     => [
                                ['type' => 'document', 'title' => 'Our Rules and Regulations', 'content' => ''],
                                ['type' => 'text', 'title' => 'Daily Communications Protocol', 'content' => '<p>How we communicate: email, chat, meetings, and escalation procedures.</p>'],
                                ['type' => 'text', 'title' => 'Time Off & Attendance Policy', 'content' => '<p>How to request time off, attendance expectations, and reporting procedures.</p>'],
                            ],
                        ],
                    ],
                ],
            ],

            // ── Safety & Compliance ──
            [
                'name'        => 'Food Safety (HACCP)',
                'description' => 'Comprehensive food safety training covering HACCP principles, hygiene, and contamination prevention.',
                'category'    => 'Safety & Compliance',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'Why is Food Safety So Important?',
                            'description' => 'Understanding the fundamentals',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Introduction', 'content' => '<h2>Food Safety Fundamentals</h2><p>Food safety is critical for protecting public health and maintaining customer trust.</p>'],
                                ['type' => 'text', 'title' => 'Public Health Protection', 'content' => '<p>Understanding foodborne illness, contamination sources, and the impact on public health.</p>'],
                                ['type' => 'text', 'title' => 'Legal Compliance', 'content' => '<p>Local, state, and federal food safety regulations you must follow.</p>'],
                                ['type' => 'text', 'title' => 'Reputation and Customer Confidence', 'content' => '<p>How food safety practices build customer trust and protect your brand.</p>'],
                                ['type' => 'text', 'title' => 'Cost Savings', 'content' => '<p>Preventing recalls, lawsuits, and waste through proper food safety.</p>'],
                                ['type' => 'text', 'title' => 'Conclusion', 'content' => '<p>Key takeaways and your responsibility in maintaining food safety standards.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Personal Hygiene',
                            'description' => 'Handwashing, grooming, and illness policies',
                            'objects'     => [
                                ['type' => 'video', 'title' => 'Proper Handwashing Technique', 'content' => ''],
                                ['type' => 'text', 'title' => 'Preventing Contamination', 'content' => '<p>Cross-contamination prevention, proper glove use, and personal hygiene standards.</p>'],
                                ['type' => 'text', 'title' => 'Illness Reporting', 'content' => '<p>When and how to report illness. Exclusion and restriction policies.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Temperature Control',
                            'description' => 'Critical temperature management',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'The Danger Zone', 'content' => '<p>Understanding the 41°F – 135°F danger zone and time/temperature abuse.</p>'],
                                ['type' => 'text', 'title' => 'Proper Cooking Temperatures', 'content' => '<p>Minimum internal cooking temperatures for different food types.</p>'],
                                ['type' => 'text', 'title' => 'Cooling & Reheating', 'content' => '<p>Safe cooling and reheating procedures to prevent bacterial growth.</p>'],
                            ],
                        ],
                    ],
                ],
            ],

            [
                'name'        => 'OSHA Explained',
                'description' => 'Workplace safety fundamentals covering OSHA regulations, hazard recognition, and employee rights.',
                'category'    => 'Safety & Compliance',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'Introduction to OSHA',
                            'description' => 'What is OSHA and why it matters',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'What is OSHA?', 'content' => '<h2>Occupational Safety and Health Administration</h2><p>OSHA is a federal agency that sets and enforces standards for safe and healthy working conditions.</p>'],
                                ['type' => 'text', 'title' => 'Employee Rights', 'content' => '<p>Your rights under OSHA including the right to a safe workplace, reporting hazards, and whistleblower protections.</p>'],
                                ['type' => 'text', 'title' => 'Employer Responsibilities', 'content' => '<p>What employers must provide: training, PPE, hazard communication, and record-keeping.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Hazard Recognition',
                            'description' => 'Identifying common workplace hazards',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Physical Hazards', 'content' => '<p>Noise, vibration, temperature extremes, and radiation hazards.</p>'],
                                ['type' => 'text', 'title' => 'Chemical Hazards', 'content' => '<p>Understanding SDS sheets, chemical labeling, and safe handling procedures.</p>'],
                                ['type' => 'text', 'title' => 'Ergonomic Hazards', 'content' => '<p>Preventing repetitive strain injuries, proper lifting techniques, and workstation setup.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Reporting & Documentation',
                            'description' => 'How to report incidents and near-misses',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Incident Reporting', 'content' => '<p>How to report workplace injuries, illnesses, and near-miss events.</p>'],
                                ['type' => 'document', 'title' => 'Incident Report Form', 'content' => ''],
                                ['type' => 'text', 'title' => 'OSHA 300 Log', 'content' => '<p>Understanding recordkeeping requirements and the OSHA 300 log.</p>'],
                            ],
                        ],
                    ],
                ],
            ],

            [
                'name'        => 'Fire Safety',
                'description' => 'Fire prevention, emergency procedures, and extinguisher training.',
                'category'    => 'Safety & Compliance',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'Fire Prevention',
                            'description' => 'How to prevent fires in the workplace',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Common Causes of Workplace Fires', 'content' => '<p>Electrical faults, flammable materials, cooking equipment, and human error.</p>'],
                                ['type' => 'text', 'title' => 'Prevention Best Practices', 'content' => '<p>Housekeeping, electrical safety, proper storage of flammables, and no-smoking policies.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Emergency Procedures',
                            'description' => 'What to do in case of fire',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'The RACE Protocol', 'content' => '<h3>R.A.C.E.</h3><ul><li><strong>R</strong>escue anyone in immediate danger</li><li><strong>A</strong>ctivate the fire alarm</li><li><strong>C</strong>onfine the fire by closing doors</li><li><strong>E</strong>vacuate or Extinguish</li></ul>'],
                                ['type' => 'text', 'title' => 'Evacuation Routes', 'content' => '<p>Know your exits, assembly points, and evacuation procedures.</p>'],
                                ['type' => 'image', 'title' => 'Emergency Exit Map', 'content' => ''],
                            ],
                        ],
                        [
                            'title'       => 'Fire Extinguisher Training',
                            'description' => 'How to use a fire extinguisher',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'The PASS Technique', 'content' => '<h3>P.A.S.S.</h3><ul><li><strong>P</strong>ull the pin</li><li><strong>A</strong>im at the base of the fire</li><li><strong>S</strong>queeze the handle</li><li><strong>S</strong>weep side to side</li></ul>'],
                                ['type' => 'text', 'title' => 'Types of Fire Extinguishers', 'content' => '<p>Class A, B, C, D, and K extinguishers and when to use each.</p>'],
                                ['type' => 'video', 'title' => 'Fire Extinguisher Demo', 'content' => ''],
                            ],
                        ],
                    ],
                ],
            ],

            [
                'name'        => 'First Aid',
                'description' => 'Basic first aid knowledge for workplace emergencies.',
                'category'    => 'Safety & Compliance',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'First Aid Basics',
                            'description' => 'Fundamental first aid skills',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'What is First Aid?', 'content' => '<p>First aid is the immediate care given to a person who has been injured or suddenly taken ill.</p>'],
                                ['type' => 'text', 'title' => 'First Aid Kit Contents', 'content' => '<p>What should be in your workplace first aid kit and where it\'s located.</p>'],
                                ['type' => 'text', 'title' => 'When to Call 911', 'content' => '<p>Recognizing life-threatening emergencies that require professional medical help.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Common Injuries',
                            'description' => 'How to handle frequent workplace injuries',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Cuts and Wounds', 'content' => '<p>How to clean, treat, and bandage minor cuts and wounds.</p>'],
                                ['type' => 'text', 'title' => 'Burns', 'content' => '<p>First, second, and third-degree burns: recognition and treatment.</p>'],
                                ['type' => 'text', 'title' => 'Sprains and Strains', 'content' => '<p>RICE method: Rest, Ice, Compression, Elevation.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'CPR & AED',
                            'description' => 'Life-saving techniques',
                            'objects'     => [
                                ['type' => 'video', 'title' => 'CPR Demonstration', 'content' => ''],
                                ['type' => 'text', 'title' => 'How to Use an AED', 'content' => '<p>Step-by-step guide to using an Automated External Defibrillator.</p>'],
                            ],
                        ],
                    ],
                ],
            ],

            [
                'name'        => 'Personal Protective Equipment',
                'description' => 'Proper selection, use, and maintenance of PPE.',
                'category'    => 'Safety & Compliance',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'PPE Fundamentals',
                            'description' => 'Understanding personal protective equipment',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Why PPE Matters', 'content' => '<p>The last line of defense against workplace hazards. When and why PPE is required.</p>'],
                                ['type' => 'text', 'title' => 'Types of PPE', 'content' => '<p>Head, eye, ear, respiratory, hand, and foot protection options.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Proper Use & Care',
                            'description' => 'Getting the most from your PPE',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Proper Fit & Selection', 'content' => '<p>How to select the right PPE for the job and ensure proper fit.</p>'],
                                ['type' => 'text', 'title' => 'Inspection & Maintenance', 'content' => '<p>Daily inspection routines, cleaning, storage, and replacement schedules.</p>'],
                                ['type' => 'text', 'title' => 'Limitations of PPE', 'content' => '<p>Understanding what PPE can and cannot protect against.</p>'],
                            ],
                        ],
                    ],
                ],
            ],

            // ── Operations ──
            [
                'name'        => 'Customer Service Basics',
                'description' => 'Essential customer service skills for frontline employees.',
                'category'    => 'Operations',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'Service Fundamentals',
                            'description' => 'Core customer service principles',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'What Great Service Looks Like', 'content' => '<p>The key behaviors that create outstanding customer experiences.</p>'],
                                ['type' => 'text', 'title' => 'Communication Skills', 'content' => '<p>Active listening, positive language, and professional tone.</p>'],
                                ['type' => 'text', 'title' => 'Phone & Email Etiquette', 'content' => '<p>Professional standards for phone calls and written communication.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Handling Difficult Situations',
                            'description' => 'De-escalation and problem resolution',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'De-escalation Techniques', 'content' => '<p>How to calm frustrated customers and turn negative situations positive.</p>'],
                                ['type' => 'text', 'title' => 'Complaint Resolution', 'content' => '<p>The LAST method: Listen, Apologize, Solve, Thank.</p>'],
                            ],
                        ],
                    ],
                ],
            ],

            [
                'name'        => 'Equipment Operation',
                'description' => 'Safe operation procedures for workplace equipment and machinery.',
                'category'    => 'Operations',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'Pre-Operation Checks',
                            'description' => 'Before you start',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Daily Inspection Checklist', 'content' => '<p>Visual and functional checks to perform before operating any equipment.</p>'],
                                ['type' => 'document', 'title' => 'Equipment Inspection Form', 'content' => ''],
                            ],
                        ],
                        [
                            'title'       => 'Safe Operation',
                            'description' => 'Operating procedures and best practices',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Operating Procedures', 'content' => '<p>Step-by-step standard operating procedures for safe equipment use.</p>'],
                                ['type' => 'text', 'title' => 'Emergency Stop Procedures', 'content' => '<p>How to safely shut down equipment in an emergency.</p>'],
                                ['type' => 'video', 'title' => 'Equipment Demo Video', 'content' => ''],
                            ],
                        ],
                    ],
                ],
            ],

            // ── HR & Policies ──
            [
                'name'        => 'Anti-Harassment Training',
                'description' => 'Workplace harassment prevention, recognition, and reporting procedures.',
                'category'    => 'HR & Policies',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'Understanding Harassment',
                            'description' => 'Definitions and examples',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'What is Workplace Harassment?', 'content' => '<p>Legal definitions, types of harassment, and the difference between harassment and bullying.</p>'],
                                ['type' => 'text', 'title' => 'Sexual Harassment', 'content' => '<p>Quid pro quo vs. hostile work environment. Examples and boundaries.</p>'],
                                ['type' => 'text', 'title' => 'Discrimination', 'content' => '<p>Protected classes, unconscious bias, and inclusive workplace practices.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Reporting & Response',
                            'description' => 'What to do if you witness or experience harassment',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'How to Report', 'content' => '<p>Reporting channels, confidentiality, and non-retaliation policies.</p>'],
                                ['type' => 'text', 'title' => 'Bystander Intervention', 'content' => '<p>How to safely intervene when you witness harassment.</p>'],
                                ['type' => 'document', 'title' => 'Harassment Report Form', 'content' => ''],
                            ],
                        ],
                    ],
                ],
            ],

            [
                'name'        => 'Company Policies & Handbook',
                'description' => 'Complete company policies reference including attendance, dress code, and conduct.',
                'category'    => 'HR & Policies',
                'content'     => [
                    'sections' => [
                        [
                            'title'       => 'Attendance & Time Off',
                            'description' => 'Scheduling and leave policies',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Attendance Policy', 'content' => '<p>Expectations for punctuality, absence reporting, and attendance tracking.</p>'],
                                ['type' => 'text', 'title' => 'Time Off & Leave', 'content' => '<p>Vacation, sick days, personal days, and how to request time off.</p>'],
                            ],
                        ],
                        [
                            'title'       => 'Workplace Conduct',
                            'description' => 'Standards of behavior',
                            'objects'     => [
                                ['type' => 'text', 'title' => 'Code of Conduct', 'content' => '<p>Professional behavior expectations, dress code, and workplace standards.</p>'],
                                ['type' => 'text', 'title' => 'Social Media Policy', 'content' => '<p>Guidelines for representing the company on social media.</p>'],
                                ['type' => 'text', 'title' => 'Disciplinary Process', 'content' => '<p>Progressive discipline steps and what to expect.</p>'],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($templates as $template) {
            CourseTemplate::create([
                'tenant_id' => null,
                'is_system' => true,
                ...$template,
            ]);
        }
    }
}
