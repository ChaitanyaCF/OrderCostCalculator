import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  DragIndicator,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AutoAwesome as AIIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { TransformationBuilder } from './TransformationBuilder';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Types
interface SourceField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  sampleValue?: any;
  possibleValues?: string[];
}

interface TargetField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  entityType: string;
  fieldPath: string;
}

interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformationRule?: string;
  isActive: boolean;
  confidenceScore: number;
  mappingType: 'DIRECT' | 'TRANSFORMED' | 'CALCULATED' | 'CONDITIONAL';
}

interface MappingSuggestion {
  sourceField: string;
  targetField: string;
  confidenceScore: number;
  reason: string;
  suggestedTransformation?: string;
  alternativeTargets?: string[];
}

interface FieldMappingCanvasProps {
  sourceFields: SourceField[];
  targetFields: TargetField[];
  mappings: FieldMapping[];
  suggestions: MappingSuggestion[];
  onMappingCreate: (sourceField: string, targetField: string) => void;
  onMappingUpdate: (mapping: FieldMapping) => void;
  onMappingDelete: (mappingId: string) => void;
  onTransformationEdit: (mappingId: string, transformation: string) => void;
  onSuggestTransformation: (sourceValue: any, targetType: string, context: string) => Promise<any>;
  loading?: boolean;
}

// Drag and Drop Types
const ItemTypes = {
  SOURCE_FIELD: 'sourceField',
  TARGET_FIELD: 'targetField',
  MAPPING_LINE: 'mappingLine'
};

// Source Field Component
const SourceFieldItem: React.FC<{
  field: SourceField;
  mappings: FieldMapping[];
  onDragStart: (field: SourceField) => void;
}> = ({ field, mappings, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SOURCE_FIELD,
    item: { field },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const isMapped = mappings.some(m => m.sourceField === field.name);

  return (
    <Card
      ref={drag}
      sx={{
        mb: 1,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        border: isMapped ? '2px solid #4caf50' : '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: 2,
          borderColor: '#2196f3'
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1}>
          <DragIndicator color="action" fontSize="small" />
          <Box flex={1}>
            <Typography variant="body2" fontWeight="medium">
              {field.name}
            </Typography>
            <Box display="flex" gap={0.5} mt={0.5}>
              <Chip 
                label={field.type} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              {field.required && (
                <Chip 
                  label="Required" 
                  size="small" 
                  color="error" 
                  variant="outlined"
                />
              )}
            </Box>
            {field.sampleValue && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Sample: {String(field.sampleValue).substring(0, 50)}
                {String(field.sampleValue).length > 50 ? '...' : ''}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Target Field Component
const TargetFieldItem: React.FC<{
  field: TargetField;
  mappings: FieldMapping[];
  onDrop: (sourceField: SourceField, targetField: TargetField) => void;
}> = ({ field, mappings, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.SOURCE_FIELD,
    drop: (item: { field: SourceField }) => {
      onDrop(item.field, field);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const mapping = mappings.find(m => m.targetField === field.name);
  const isMapped = !!mapping;

  return (
    <Card
      ref={drop}
      sx={{
        mb: 1,
        border: isMapped ? '2px solid #4caf50' : 
               isOver && canDrop ? '2px solid #2196f3' : 
               '1px solid #e0e0e0',
        backgroundColor: isOver && canDrop ? '#e3f2fd' : 
                         isMapped ? '#f1f8e9' : 'white',
        '&:hover': {
          boxShadow: 2,
          borderColor: isMapped ? '#4caf50' : '#2196f3'
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box flex={1}>
            <Typography variant="body2" fontWeight="medium">
              {field.name}
            </Typography>
            <Box display="flex" gap={0.5} mt={0.5}>
              <Chip 
                label={field.type} 
                size="small" 
                color="secondary" 
                variant="outlined"
              />
              {field.required && (
                <Chip 
                  label="Required" 
                  size="small" 
                  color="error" 
                  variant="outlined"
                />
              )}
              <Chip 
                label={field.entityType} 
                size="small" 
                color="info" 
                variant="outlined"
              />
            </Box>
            {field.description && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {field.description}
              </Typography>
            )}
          </Box>
          {mapping && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <LinkIcon color="success" fontSize="small" />
              <Typography variant="caption" color="success.main">
                Mapped
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Mapping Connection Component
const MappingConnection: React.FC<{
  mapping: FieldMapping;
  suggestion?: MappingSuggestion;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  sourceFields: SourceField[];
  targetFields: TargetField[];
  onAdvancedBuilder: (mapping: FieldMapping, sourceField: SourceField, targetField: TargetField) => void;
}> = ({ mapping, suggestion, onEdit, onDelete, onPreview, sourceFields, targetFields, onAdvancedBuilder }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#4caf50';
    if (score >= 0.6) return '#ff9800';
    return '#f44336';
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 1,
        border: `2px solid ${getConfidenceColor(mapping.confidenceScore)}`,
        borderRadius: 2
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box flex={1}>
          <Typography variant="body2" fontWeight="medium">
            {mapping.sourceField} → {mapping.targetField}
          </Typography>
          <Box display="flex" gap={1} mt={0.5}>
            <Chip 
              label={mapping.mappingType} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={`${Math.round(mapping.confidenceScore * 100)}% confidence`} 
              size="small" 
              sx={{ 
                backgroundColor: getConfidenceColor(mapping.confidenceScore),
                color: 'white'
              }}
            />
            {!mapping.isActive && (
              <Chip 
                label="Inactive" 
                size="small" 
                color="default" 
                variant="outlined"
              />
            )}
          </Box>
          {mapping.transformationRule && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Transform: {mapping.transformationRule}
            </Typography>
          )}
          {suggestion?.reason && (
            <Typography variant="caption" color="info.main" sx={{ mt: 0.5, display: 'block' }}>
              AI Reason: {suggestion.reason}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={0.5}>
          <Tooltip title="Advanced Builder">
            <IconButton size="small" onClick={() => {
              // Find the source and target fields for this mapping
              const sourceField = sourceFields.find(f => f.name === mapping.sourceField);
              const targetField = targetFields.find(f => f.name === mapping.targetField);
              if (sourceField && targetField) {
                onAdvancedBuilder(mapping, sourceField, targetField);
              }
            }}>
              <BuildIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preview transformation">
            <IconButton size="small" onClick={onPreview}>
              <PreviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit mapping">
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete mapping">
            <IconButton size="small" onClick={onDelete} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

// AI Suggestions Panel
const AISuggestionsPanel: React.FC<{
  suggestions: MappingSuggestion[];
  onAcceptSuggestion: (suggestion: MappingSuggestion) => void;
  onRejectSuggestion: (suggestion: MappingSuggestion) => void;
}> = ({ suggestions, onAcceptSuggestion, onRejectSuggestion }) => {
  if (suggestions.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No AI suggestions available. Try discovering fields first.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="primary" />
        AI Suggestions ({suggestions.length})
      </Typography>
      {suggestions.map((suggestion, index) => (
        <Paper key={index} elevation={1} sx={{ p: 2, mb: 1, backgroundColor: '#f8f9fa' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box flex={1}>
              <Typography variant="body2" fontWeight="medium">
                {suggestion.sourceField} → {suggestion.targetField}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {suggestion.reason}
              </Typography>
              <Box display="flex" gap={1} mt={0.5}>
                <Chip 
                  label={`${Math.round(suggestion.confidenceScore * 100)}% confidence`} 
                  size="small" 
                  color={suggestion.confidenceScore >= 0.8 ? 'success' : 
                         suggestion.confidenceScore >= 0.6 ? 'warning' : 'error'}
                  variant="outlined"
                />
                {suggestion.suggestedTransformation && (
                  <Chip 
                    label="Has transformation" 
                    size="small" 
                    color="info" 
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Button 
                size="small" 
                variant="contained" 
                color="primary"
                onClick={() => onAcceptSuggestion(suggestion)}
              >
                Accept
              </Button>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => onRejectSuggestion(suggestion)}
              >
                Reject
              </Button>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

// Main Field Mapping Canvas Component
export const FieldMappingCanvas: React.FC<FieldMappingCanvasProps> = ({
  sourceFields,
  targetFields,
  mappings,
  suggestions,
  onMappingCreate,
  onMappingUpdate,
  onMappingDelete,
  onTransformationEdit,
  onSuggestTransformation,
  loading = false
}) => {
  const [editingMapping, setEditingMapping] = useState<FieldMapping | null>(null);
  const [transformationDialog, setTransformationDialog] = useState(false);
  const [transformationRule, setTransformationRule] = useState('');
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [advancedBuilderDialog, setAdvancedBuilderDialog] = useState(false);
  const [currentSourceField, setCurrentSourceField] = useState<SourceField | null>(null);
  const [currentTargetField, setCurrentTargetField] = useState<TargetField | null>(null);

  const handleDrop = useCallback((sourceField: SourceField, targetField: TargetField) => {
    // Check if mapping already exists
    const existingMapping = mappings.find(
      m => m.sourceField === sourceField.name && m.targetField === targetField.name
    );
    
    if (existingMapping) {
      return; // Mapping already exists
    }

    onMappingCreate(sourceField.name, targetField.name);
  }, [mappings, onMappingCreate]);

  const handleEditMapping = (mapping: FieldMapping) => {
    setEditingMapping(mapping);
    setTransformationRule(mapping.transformationRule || '');
    setTransformationDialog(true);
  };

  const handleSaveTransformation = () => {
    if (editingMapping) {
      onTransformationEdit(editingMapping.id, transformationRule);
      setTransformationDialog(false);
      setEditingMapping(null);
      setTransformationRule('');
    }
  };

  const handlePreviewMapping = async (mapping: FieldMapping) => {
    const sourceField = sourceFields.find(f => f.name === mapping.sourceField);
    const targetField = targetFields.find(f => f.name === mapping.targetField);
    
    if (sourceField && targetField) {
      try {
        const preview = await onSuggestTransformation(
          sourceField.sampleValue,
          targetField.type,
          `Mapping ${sourceField.name} to ${targetField.name}`
        );
        setPreviewData(preview);
        setPreviewDialog(true);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      }
    }
  };

  const handleAcceptSuggestion = (suggestion: MappingSuggestion) => {
    onMappingCreate(suggestion.sourceField, suggestion.targetField);
  };

  const handleRejectSuggestion = (suggestion: MappingSuggestion) => {
    // Remove suggestion from list (would typically update parent state)
    console.log('Rejected suggestion:', suggestion);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Discovering fields and generating AI suggestions...
        </Typography>
      </Box>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* AI Suggestions Panel */}
        {suggestions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <AISuggestionsPanel
              suggestions={suggestions}
              onAcceptSuggestion={handleAcceptSuggestion}
              onRejectSuggestion={handleRejectSuggestion}
            />
          </Box>
        )}

        {/* Main Mapping Area */}
        <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 500 }}>
          {/* Source Fields */}
          <Paper elevation={2} sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Source Fields ({sourceFields.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag fields from here to target fields to create mappings
            </Typography>
            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
              {sourceFields.map((field) => (
                <SourceFieldItem
                  key={field.name}
                  field={field}
                  mappings={mappings}
                  onDragStart={() => {}}
                />
              ))}
            </Box>
          </Paper>

          {/* Mappings Display */}
          <Paper elevation={2} sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom color="success.main">
              Active Mappings ({mappings.length})
            </Typography>
            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
              {mappings.length === 0 ? (
                <Alert severity="info">
                  No mappings created yet. Drag source fields to target fields to create mappings.
                </Alert>
              ) : (
                mappings.map((mapping) => {
                  const suggestion = suggestions.find(
                    s => s.sourceField === mapping.sourceField && s.targetField === mapping.targetField
                  );
                  return (
                    <MappingConnection
                      key={mapping.id}
                      mapping={mapping}
                      suggestion={suggestion}
                      onEdit={() => handleEditMapping(mapping)}
                      onDelete={() => onMappingDelete(mapping.id)}
                      onPreview={() => handlePreviewMapping(mapping)}
                      sourceFields={sourceFields}
                      targetFields={targetFields}
                      onAdvancedBuilder={(mapping, sourceField, targetField) => {
                        setCurrentSourceField(sourceField);
                        setCurrentTargetField(targetField);
                        setEditingMapping(mapping);
                        setAdvancedBuilderDialog(true);
                      }}
                    />
                  );
                })
              )}
            </Box>
          </Paper>

          {/* Target Fields */}
          <Paper elevation={2} sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom color="secondary">
              Target Fields ({targetFields.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drop source fields here to create mappings
            </Typography>
            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
              {targetFields.map((field) => (
                <TargetFieldItem
                  key={field.name}
                  field={field}
                  mappings={mappings}
                  onDrop={handleDrop}
                />
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Transformation Edit Dialog */}
        <Dialog 
          open={transformationDialog} 
          onClose={() => setTransformationDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Edit Transformation Rule
            {editingMapping && (
              <Typography variant="body2" color="text.secondary">
                {editingMapping.sourceField} → {editingMapping.targetField}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Transformation Rule (JavaScript-like expression)"
              value={transformationRule}
              onChange={(e) => setTransformationRule(e.target.value)}
              placeholder="e.g., value.toUpperCase(), parseFloat(value) * 1000, new Date(value).toISOString()"
              helperText="Use 'value' to reference the source field value. Common functions: toUpperCase(), toLowerCase(), parseFloat(), parseInt(), new Date()"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTransformationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTransformation} variant="contained">
              Save Transformation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog 
          open={previewDialog} 
          onClose={() => setPreviewDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Transformation Preview</DialogTitle>
          <DialogContent>
            {previewData && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Transformation:</strong> {previewData.transformation}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Explanation:</strong> {previewData.explanation}
                </Typography>
                {previewData.examples && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Examples:</strong>
                    </Typography>
                    {previewData.examples.map((example: string, index: number) => (
                      <Typography key={index} variant="caption" display="block" sx={{ ml: 2 }}>
                        {example}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Advanced Transformation Builder Dialog */}
        <Dialog 
          open={advancedBuilderDialog} 
          onClose={() => setAdvancedBuilderDialog(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{ sx: { height: '90vh' } }}
        >
          {currentSourceField && currentTargetField && (
            <TransformationBuilder
              sourceField={{
                name: currentSourceField.name,
                type: currentSourceField.type,
                sampleValue: currentSourceField.sampleValue || 'sample_value'
              }}
              targetField={{
                name: currentTargetField.name,
                type: currentTargetField.type,
                format: currentTargetField.description
              }}
              initialTransformation={editingMapping?.transformationRule || ''}
              onSave={(transformation, rules) => {
                if (editingMapping) {
                  onTransformationEdit(editingMapping.id, transformation);
                }
                setAdvancedBuilderDialog(false);
                setEditingMapping(null);
                setCurrentSourceField(null);
                setCurrentTargetField(null);
              }}
              onCancel={() => {
                setAdvancedBuilderDialog(false);
                setEditingMapping(null);
                setCurrentSourceField(null);
                setCurrentTargetField(null);
              }}
              onPreview={async (transformation) => {
                // Implement preview functionality
                return `Preview result for: ${transformation}`;
              }}
              onGetAISuggestions={async (context) => {
                // Get AI suggestions for transformations
                try {
                  const response = await onSuggestTransformation(
                    currentSourceField?.sampleValue,
                    currentTargetField?.type || 'string',
                    context
                  );
                  
                  // Convert the response to the expected format
                  return [{
                    confidence: 0.9,
                    transformation: response.transformation || 'value',
                    explanation: response.explanation || 'AI-generated transformation',
                    category: 'AI Suggestion',
                    examples: response.examples || []
                  }];
                } catch (error) {
                  console.error('Failed to get AI suggestions:', error);
                  return [];
                }
              }}
            />
          )}
        </Dialog>
      </Box>
    </DndProvider>
  );
};

export default FieldMappingCanvas;
