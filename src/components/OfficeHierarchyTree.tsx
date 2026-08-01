/**
 * Office Hierarchy Visualization Component
 * Displays office hierarchy tree with parent-child relationships
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronRight, ChevronDown, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfficeStore } from '@/stores';
import type { Office } from '@/types/office';

interface OfficeNode {
  office: Office;
  children: OfficeNode[];
  employeeCount: number;
}

interface OfficeTreeNodeProps {
  node: OfficeNode;
  level: number;
  onSelect?: (office: Office) => void;
}

const OfficeTreeNode = ({ node, level, onSelect }: OfficeTreeNodeProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels
  
  const hasChildren = node.children.length > 0;
  const indent = level * 24;
  
  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md cursor-pointer transition-colors"
        style={{ paddingLeft: `${indent + 12}px` }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect?.(node.office);
        }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}
        
        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-medium truncate">{node.office.name}</span>
          
          <Badge variant="outline" className="flex-shrink-0">
            {t(`offices.type.${node.office.type}`)}
          </Badge>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Users className="h-3 w-3" />
            <span>{node.employeeCount}</span>
          </div>
        </div>
        
        {node.office.status === 'inactive' && (
          <Badge variant="secondary" className="flex-shrink-0">
            {t('offices.status.inactive')}
          </Badge>
        )}
      </div>
      
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <OfficeTreeNode
              key={child.office.officeId}
              node={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface OfficeHierarchyTreeProps {
  companyId: string;
  onOfficeSelect?: (office: Office) => void;
}

export default function OfficeHierarchyTree({ companyId, onOfficeSelect }: OfficeHierarchyTreeProps) {
  const { t } = useTranslation();
  const { offices, officeListItems, fetchOffices, fetchOfficeListItems, loading } = useOfficeStore();
  const [hierarchyTree, setHierarchyTree] = useState<OfficeNode[]>([]);
  
  useEffect(() => {
    if (companyId) {
      fetchOffices(companyId);
      fetchOfficeListItems(companyId);
    }
  }, [companyId]);
  
  useEffect(() => {
    // Build hierarchy tree
    if (offices.length === 0) {
      setHierarchyTree([]);
      return;
    }
    
    // Create employee count map
    const employeeCountMap = new Map<string, number>();
    officeListItems.forEach(item => {
      employeeCountMap.set(item.officeId, item.employeeCount);
    });
    
    // Create office map
    const officeMap = new Map<string, Office>();
    offices.forEach(office => {
      officeMap.set(office.officeId, office);
    });
    
    // Build tree structure
    const buildTree = (parentId: string | undefined): OfficeNode[] => {
      const children = offices
        .filter(office => office.parentOfficeId === parentId)
        .map(office => ({
          office,
          children: buildTree(office.officeId),
          employeeCount: employeeCountMap.get(office.officeId) || 0,
        }))
        .sort((a, b) => {
          // Sort by type (head_office first) then by name
          const typeOrder = { head_office: 0, branch: 1, remote: 2 };
          const typeCompare = typeOrder[a.office.type] - typeOrder[b.office.type];
          if (typeCompare !== 0) return typeCompare;
          return a.office.name.localeCompare(b.office.name);
        });
      
      return children;
    };
    
    const tree = buildTree(undefined);
    setHierarchyTree(tree);
  }, [offices, officeListItems]);
  
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (hierarchyTree.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{t('offices.hierarchy.no_offices')}</p>
          <p className="text-muted-foreground mt-2">{t('offices.hierarchy.no_offices_desc')}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t('offices.hierarchy.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {hierarchyTree.map((node) => (
            <OfficeTreeNode
              key={node.office.officeId}
              node={node}
              level={0}
              onSelect={onOfficeSelect}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
