import React, { useState, useEffect } from 'react';
import { contractTemplateApi } from'../api/contractTemplate';
import type { ContractTemplate, CreateContractTemplateRequest, UpdateContractTemplateRequest } from'../types/contractTemplate';
import { Plus, Edit2, Trash2, Eye, X, Save } from 'lucide-react';
import { Card, Modal, Button, Input, Textarea } from'../../../components/ui';

export default function ContractTemplates() {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);
    const [formData, setFormData] = useState<CreateContractTemplateRequest>({
        name: '',
        description: '',
        header_content: '',
        body_content: '',
        footer_content: '',
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await contractTemplateApi.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
            alert('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setFormData({
            name: '',
            description: '',
            header_content: '',
            body_content: '',
            footer_content: '',
        });
        setShowModal(true);
    };

    const handleEdit = (template: ContractTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || '',
            header_content: template.header_content || '',
            body_content: template.body_content,
            footer_content: template.footer_content || '',
        });
        setShowModal(true);
    };

    const handlePreview = (template: ContractTemplate) => {
        setPreviewTemplate(template);
        setShowPreview(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                const updateData: UpdateContractTemplateRequest = {
                    name: formData.name,
                    description: formData.description || undefined,
                    header_content: formData.header_content || undefined,
                    body_content: formData.body_content,
                    footer_content: formData.footer_content || undefined,
                };
                await contractTemplateApi.update(editingTemplate.id, updateData);
            } else {
                await contractTemplateApi.create(formData);
            }
            setShowModal(false);
            loadTemplates();
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Failed to save template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await contractTemplateApi.delete(id);
            loadTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
            alert('Failed to delete template');
        }
    };

    const handleToggleActive = async (template: ContractTemplate) => {
        try {
            await contractTemplateApi.update(template.id, {
                is_active: !template.is_active,
            });
            loadTemplates();
        } catch (error) {
            console.error('Failed to toggle template status:', error);
            alert('Failed to update template status');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Contract Templates</h1>
                    <p className="text-muted-foreground mt-1">Manage reusable contract templates</p>
                </div>
                <Button
                    onClick={handleCreate}
                    leftIcon={<Plus size={16} />}
                >
                    Create Template
                </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <Card
                        key={template.id}
                        className="hover:shadow-lg transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                                {template.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                                )}
                            </div>
                            <span
                                className={`px-2 py-1 text-xs rounded-full ${template.is_active
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {template.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                                <span>Created: {new Date(template.created_at || '').toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button
                                variant="secondary"
                                onClick={() => handlePreview(template)}
                                className="flex-1"
                            >
                                <Eye size={16} className="mr-2" /> Preview
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleEdit(template)}
                                className="flex-1 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                            >
                                <Edit2 size={16} className="mr-2" /> Edit
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleDelete(template.id)}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => handleToggleActive(template)}
                            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground"
                        >
                            {template.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                    </Card>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No templates found</p>
                    <p className="text-muted-foreground/60 mt-2">Create your first contract template to get started</p>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingTemplate ? 'Edit Template' : 'Create Template'}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Template Name *"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Standard Rental Agreement"
                    />
                    <Input
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of this template"
                    />
                    <Textarea
                        label="Header Content"
                        value={formData.header_content}
                        onChange={(e) => setFormData({ ...formData, header_content: e.target.value })}
                        rows={3}
                        placeholder="Header content (optional)"
                        className="font-mono text-sm"
                    />
                    <div>
                        <Textarea
                            label="Body Content *"
                            required
                            value={formData.body_content}
                            onChange={(e) => setFormData({ ...formData, body_content: e.target.value })}
                            rows={12}
                            placeholder="Main contract content..."
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Tip: Use variables like {'{{client_name}}'}, {'{{contract_date}}'}, {'{{amount}}'} for dynamic content
                        </p>
                    </div>
                    <Textarea
                        label="Footer Content"
                        value={formData.footer_content}
                        onChange={(e) => setFormData({ ...formData, footer_content: e.target.value })}
                        rows={3}
                        placeholder="Footer content (optional)"
                        className="font-mono text-sm"
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Save size={16} className="mr-2" /> {editingTemplate ? 'Update' : 'Create'} Template
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title="Template Preview"
                size="xl"
            >
                {previewTemplate && (
                    <div className="space-y-6">
                        <div className="mb-4">
                            <h3 className="text-xl font-semibold text-foreground">{previewTemplate.name}</h3>
                            {previewTemplate.description && (
                                <p className="text-muted-foreground mt-1">{previewTemplate.description}</p>
                            )}
                        </div>

                        <div className="bg-background rounded-lg p-6 space-y-6 border border-border">
                            {previewTemplate.header_content && (
                                <div className="border-b border-border pb-4">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Header</h4>
                                    <div className="whitespace-pre-wrap text-sm text-foreground">{previewTemplate.header_content}</div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Body</h4>
                                <div className="whitespace-pre-wrap text-sm text-foreground">{previewTemplate.body_content}</div>
                            </div>

                            {previewTemplate.footer_content && (
                                <div className="border-t border-border pt-4">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Footer</h4>
                                    <div className="whitespace-pre-wrap text-sm text-foreground">{previewTemplate.footer_content}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}


